import asyncio
import speedtest
from datetime import datetime
from database import get_db_connection
from utils.system import get_active_interface

async def ping_task():
    while True:
        process = await asyncio.create_subprocess_exec(
            "ping", "-c", "1", "-W", "1", "8.8.8.8",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        is_online = (process.returncode == 0)
        
        iface_name, _ = get_active_interface()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO network_logs (timestamp, status, interface_name) VALUES (?, ?, ?)", 
            (datetime.utcnow(), is_online, iface_name)
        )
        conn.commit()
        conn.close()
        
        await asyncio.sleep(300)

async def speedtest_task():
    while True:
        await asyncio.sleep(10)
        try:
            def run_speedtest():
                st = speedtest.Speedtest()
                st.get_best_server()
                st.download()
                st.upload()
                return st.results.dict()
                
            results = await asyncio.to_thread(run_speedtest)
            
            download_mbps = results["download"] / 1_000_000
            upload_mbps = results["upload"] / 1_000_000
            ping_ms = results["ping"]
            
            iface_name, max_speed = get_active_interface()
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO speedtest_logs 
                (timestamp, download_mbps, upload_mbps, ping_ms, interface_name, interface_max_speed_mbps) 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (datetime.utcnow(), download_mbps, upload_mbps, ping_ms, iface_name, max_speed))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Erro no speedtest: {e}")
            
        await asyncio.sleep(1200)
