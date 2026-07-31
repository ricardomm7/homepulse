from fastapi import APIRouter
from database import get_db_connection

router = APIRouter(prefix="/api/speedtest", tags=["Speedtest"])

@router.get("/history")
def get_speedtest_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM speedtest_logs ORDER BY timestamp DESC LIMIT 50')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/latest")
def get_speedtest_latest():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM speedtest_logs ORDER BY timestamp DESC LIMIT 1')
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"status": "No speedtests recorded yet"}
    return dict(row)
