import os
import psutil
import platform

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

def get_advanced_power_metrics():
    """Tenta extrair Voltagem (V) e Potência (W) de forma segura consoante o Sistema Operativo."""
    metrics = {"voltage": None, "wattage": None}
    sys_os = platform.system()

    try:
        if sys_os == "Linux":
            # Procurar bateria BAT0 ou BAT1 em Linux
            bat_path = None
            if os.path.exists('/sys/class/power_supply/BAT0'):
                bat_path = '/sys/class/power_supply/BAT0'
            elif os.path.exists('/sys/class/power_supply/BAT1'):
                bat_path = '/sys/class/power_supply/BAT1'
                
            if bat_path:
                if os.path.exists(f'{bat_path}/voltage_now'):
                    with open(f'{bat_path}/voltage_now', 'r') as f:
                        metrics["voltage"] = float(f.read().strip()) / 1_000_000
                
                if os.path.exists(f'{bat_path}/power_now'):
                    with open(f'{bat_path}/power_now', 'r') as f:
                        metrics["wattage"] = float(f.read().strip()) / 1_000_000
                elif os.path.exists(f'{bat_path}/current_now') and metrics["voltage"]:
                    with open(f'{bat_path}/current_now', 'r') as f:
                        current_a = float(f.read().strip()) / 1_000_000
                        metrics["wattage"] = current_a * metrics["voltage"]

        elif sys_os == "Windows":
            # Tentar extrair usando WMI em Windows
            import wmi
            w = wmi.WMI()
            batteries = w.Win32_Battery()
            if batteries:
                bat = batteries[0]
                # No WMI, DesignVoltage vem em milivolts
                if hasattr(bat, 'DesignVoltage') and bat.DesignVoltage:
                    metrics["voltage"] = float(bat.DesignVoltage) / 1000.0
                
                # A obtenção real de Watts é muito limitativa via WMI sem sensores específicos do fabricante.
                # Tentamos usar algo se o WMI expuser, caso contrário fica a None para não corromper dados.
                pass
                
    except Exception as e:
        # Falha silenciosa robusta para não fazer crash ao serviço
        pass

    return metrics

def get_battery_status():
    battery = psutil.sensors_battery()
    
    battery_percent = battery.percent if battery else None
    is_plugged_in = battery.power_plugged if battery else None
    
    advanced = get_advanced_power_metrics()
    
    return battery_percent, is_plugged_in, advanced["voltage"], advanced["wattage"]
