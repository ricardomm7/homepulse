import os
import psutil

def get_active_interface():
    """Retorna a interface de rede ativa (nome, velocidade em mbps)"""
    stats = psutil.net_if_stats()
    addrs = psutil.net_if_addrs()
    
    for iface_name, stat in stats.items():
        if stat.isup and iface_name in addrs:
            if iface_name.startswith('lo') or iface_name == 'Loopback Pseudo-Interface 1':
                continue
            
            has_ipv4 = False
            for addr in addrs[iface_name]:
                if str(addr.family) == 'AddressFamily.AF_INET':
                    has_ipv4 = True
                    break
            
            if not has_ipv4:
                has_ipv4 = any('.' in addr.address for addr in addrs[iface_name])
                
            if has_ipv4:
                speed_mbps = stat.speed if stat.speed > 0 else 1000
                return iface_name, speed_mbps
                
    return "unknown", 0

def get_battery_status():
    battery = psutil.sensors_battery()
    
    battery_percent = battery.percent if battery else None
    is_plugged_in = battery.power_plugged if battery else None
    
    voltage = None
    wattage = None
    try:
        if os.path.exists('/sys/class/power_supply/BAT0/voltage_now'):
            with open('/sys/class/power_supply/BAT0/voltage_now', 'r') as f:
                voltage = float(f.read().strip()) / 1_000_000
        if os.path.exists('/sys/class/power_supply/BAT0/power_now'):
            with open('/sys/class/power_supply/BAT0/power_now', 'r') as f:
                wattage = float(f.read().strip()) / 1_000_000
    except Exception:
        pass
        
    return battery_percent, is_plugged_in, voltage, wattage
