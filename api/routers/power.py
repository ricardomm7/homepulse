from fastapi import APIRouter
from database import get_db_connection

router = APIRouter(prefix="/api/power", tags=["Power"])

@router.get("/latest")
def get_power_latest():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM power_logs ORDER BY timestamp DESC LIMIT 1')
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"status": "No power logs recorded yet"}
    return dict(row)

@router.get("/history")
def get_power_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM power_logs ORDER BY timestamp DESC LIMIT 4320')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/outages")
def get_power_outages():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM grid_outage_events ORDER BY start_time DESC LIMIT 50')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
