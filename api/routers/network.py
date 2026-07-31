from fastapi import APIRouter
from database import get_db_connection

router = APIRouter(prefix="/api/network", tags=["Network"])

@router.get("/history")
def get_network_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, timestamp, status, interface_name FROM network_logs ORDER BY timestamp DESC LIMIT 50')
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "timestamp": r["timestamp"], "status": bool(r["status"]), "interface_name": r["interface_name"]} for r in rows]
