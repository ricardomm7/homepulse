from fastapi import APIRouter
import psutil
from utils.system import get_active_interface, get_battery_status

router = APIRouter()

@router.get("/health")
def health_check():
    iface_name, max_speed = get_active_interface()
    battery_percent, is_plugged_in, _, _ = get_battery_status()
    return {
        "status": "ok",
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "active_interface": iface_name,
        "interface_speed_mbps": max_speed,
        "battery_percent": battery_percent,
        "is_plugged_in": is_plugged_in
    }
