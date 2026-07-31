import asyncio
from datetime import datetime
from database import get_db_connection
from utils.system import get_battery_status

async def power_task():
    while True:
        try:
            battery_percent, is_plugged_in, voltage, wattage = get_battery_status()
            
            grid_status = "ONLINE" if is_plugged_in else "OUTAGE"
            if is_plugged_in is None:
                grid_status = "UNKNOWN"
                
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT is_plugged_in FROM power_logs 
                ORDER BY timestamp DESC LIMIT 1
            ''')
            last_log = cursor.fetchone()
            
            if last_log and last_log["is_plugged_in"] is not None and is_plugged_in is not None:
                was_plugged_in = bool(last_log["is_plugged_in"])
                
                if was_plugged_in and not is_plugged_in:
                    cursor.execute(
                        "INSERT INTO grid_outage_events (start_time) VALUES (?)",
                        (datetime.utcnow(),)
                    )
                elif not was_plugged_in and is_plugged_in:
                    cursor.execute('''
                        SELECT id, start_time FROM grid_outage_events 
                        WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1
                    ''')
                    ongoing_outage = cursor.fetchone()
                    if ongoing_outage:
                        end_time = datetime.utcnow()
                        start_time = ongoing_outage["start_time"]
                        if isinstance(start_time, str):
                            try:
                                start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S.%f")
                            except:
                                start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
                                
                        duration_minutes = (end_time - start_time).total_seconds() / 60.0
                        cursor.execute('''
                            UPDATE grid_outage_events 
                            SET end_time = ?, duration_minutes = ? 
                            WHERE id = ?
                        ''', (end_time, duration_minutes, ongoing_outage["id"]))
            
            cursor.execute('''
                INSERT INTO power_logs 
                (timestamp, battery_percent, is_plugged_in, grid_status, voltage, wattage) 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (datetime.utcnow(), battery_percent, is_plugged_in, grid_status, voltage, wattage))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"Erro na power task: {e}")
            
        await asyncio.sleep(60)
