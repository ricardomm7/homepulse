import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
import psutil
import speedtest
from database import init_db, get_db_connection
from datetime import datetime

def get_active_interface():
    """Retorna a interface de rede ativa (nome, velocidade em mbps)"""
    stats = psutil.net_if_stats()
    addrs = psutil.net_if_addrs()
    
    # Procurar por uma interface que esteja "up" e não seja loopback
    for iface_name, stat in stats.items():
        if stat.isup and iface_name in addrs:
            # Ignorar loopback
            if iface_name.startswith('lo') or iface_name == 'Loopback Pseudo-Interface 1':
                continue
            
            # Verificar se tem IPv4 (usando código nativo para compatibilidade Linux/Windows)
            has_ipv4 = False
            for addr in addrs[iface_name]:
                # AF_INET = 2 in most socket libraries, or we can check length
                if str(addr.family) == 'AddressFamily.AF_INET':
                    has_ipv4 = True
                    break
            
            # Se não conseguir descobrir pela family, tentamos assumir que é se tiver '.' no IP
            if not has_ipv4:
                has_ipv4 = any('.' in addr.address for addr in addrs[iface_name])
                
            if has_ipv4:
                # speed é 0 em algumas placas virtuais, lidamos com isso.
                speed_mbps = stat.speed if stat.speed > 0 else 1000
                return iface_name, speed_mbps
                
    return "unknown", 0

async def ping_task():
    while True:
        # Ping the Google DNS server to check network connectivity
        process = await asyncio.create_subprocess_exec(
            "ping", "-c", "1", "-W", "1", "8.8.8.8",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        is_online = (process.returncode == 0)
        
        iface_name, _ = get_active_interface()
        
        # Save result to SQLite
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
        # Esperar um pouco antes do primeiro speedtest
        await asyncio.sleep(10)
        
        try:
            # speedtest is blocking, so we run it in a thread
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
            
        # Correr a cada 20 minutos (1200 segundos)
        await asyncio.sleep(1200)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup database and start background tasks
    init_db()
    p_task = asyncio.create_task(ping_task())
    s_task = asyncio.create_task(speedtest_task())
    yield
    # Shutdown gracefully
    p_task.cancel()
    s_task.cancel()

app = FastAPI(title="HomePulse API", description="API de monitorização do servidor", lifespan=lifespan)

@app.get("/health")
def health_check():
    iface_name, max_speed = get_active_interface()
    return {
        "status": "ok",
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "active_interface": iface_name,
        "interface_speed_mbps": max_speed
    }

@app.get("/api/network/history")
def get_network_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, timestamp, status, interface_name 
        FROM network_logs 
        ORDER BY timestamp DESC 
        LIMIT 50
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": row["id"],
            "timestamp": row["timestamp"],
            "status": bool(row["status"]),
            "interface_name": row["interface_name"]
        }
        for row in rows
    ]

@app.get("/api/speedtest/history")
def get_speedtest_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT *
        FROM speedtest_logs 
        ORDER BY timestamp DESC 
        LIMIT 50
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@app.get("/api/speedtest/latest")
def get_speedtest_latest():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT *
        FROM speedtest_logs 
        ORDER BY timestamp DESC 
        LIMIT 1
    ''')
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {"status": "No speedtests recorded yet"}
        
    return dict(row)
