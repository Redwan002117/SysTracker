import platform
import socket
import time
import psutil
import requests
import json
import logging
import win32evtlog
import datetime
import wmi
import sys
import ctypes
import os
import uuid

# Check for config.json to get API_URL
CONFIG_FILE = "config.json"
DEFAULT_CONFIG = {
    "api_url": "https://monitor.rico.bd/api",
    "api_key": "YOUR_STATIC_API_KEY_HERE"
}

def load_config():
    # Get the directory where the executable or script is running
    if getattr(sys, 'frozen', False):
        application_path = os.path.dirname(sys.executable)
    else:
        application_path = os.path.dirname(os.path.abspath(__file__))
    
    config_path = os.path.join(application_path, CONFIG_FILE)

    if not os.path.exists(config_path):
        try:
            with open(config_path, 'w') as f:
                json.dump(DEFAULT_CONFIG, f, indent=4)
            print(f"Created default config file at {config_path}")
        except Exception as e:
            print(f"Failed to create config file: {e}")
            return DEFAULT_CONFIG

    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            # Ensure keys exist
            if "api_url" not in config: config["api_url"] = DEFAULT_CONFIG["api_url"]
            if "api_key" not in config: config["api_key"] = DEFAULT_CONFIG["api_key"]
            return config
    except Exception as e:
        print(f"Error loading config: {e}")
        return DEFAULT_CONFIG

config = load_config()
API_URL = config["api_url"]
API_KEY = config["api_key"]
TELEMETRY_INTERVAL = 2 # seconds
EVENT_POLL_INTERVAL = 300 # seconds (5 minutes)
MACHINE_ID = socket.gethostname() 

# Global state for network speed calculation
last_net_io = psutil.net_io_counters()
last_net_time = time.time()

# Event Log Configuration
TARGET_EVENT_IDS = {
    41, 1074, 6005, 6006, 6008, # System Power/State
    1000, 1001, 1002,           # Application Crash/Hang
    7031, 7034,                 # Service Termination
    4624, 4625, 4720            # Security (Logon/User)
}
LOG_TYPES = ["System", "Application", "Security"]

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_volume_label(drive_letter):
    """Retrieves the volume label for a given drive letter using ctypes."""
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        volume_name_buf = ctypes.create_unicode_buffer(1024)
        # Add backslash if missing (e.g., "C:" -> "C:\")
        path = drive_letter if drive_letter.endswith('\\') else drive_letter + '\\'
        
        result = kernel32.GetVolumeInformationW(
            ctypes.c_wchar_p(path),
            volume_name_buf,
            ctypes.sizeof(volume_name_buf),
            None, None, None, None, 0
        )
        if result:
            return volume_name_buf.value
    except Exception as e:
        pass
    return ""

def get_top_processes(limit=10):
    """Collects top processes by CPU usage."""
    try:
        processes = []
        # Get logical CPU count for normalization
        cpu_count = psutil.cpu_count(logical=True) or 1
        
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'memory_info']):
            try:
                pinfo = proc.info
                # Normalize CPU percent by core count to match Task Manager (0-100% of total system)
                if pinfo['cpu_percent']:
                     pinfo['cpu_percent'] = pinfo['cpu_percent'] / cpu_count
                
                processes.append(pinfo)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess): pass
        
        processes.sort(key=lambda p: p['cpu_percent'] or 0, reverse=True)
        
        top_procs = []
        for p in processes[:limit]:
            mem_mb = 0
            if p.get('memory_info'):
                 mem_mb = round(p['memory_info'].rss / (1024 * 1024), 1)

            top_procs.append({
                'name': p['name'],
                'pid': p['pid'],
                'cpu': round(p['cpu_percent'] or 0, 1),
                'mem': round(p['memory_percent'] or 0, 1),
                'mem_mb': mem_mb
            })
        return top_procs
    except Exception as e:
        logging.error(f"Error collecting processes: {e}")
        return []

def get_logged_in_users():
    """Collects currently logged in users (psutil + quser fallback)."""
    users = []
    try:
        # Method 1: psutil
        for user in psutil.users():
            users.append({
                'user': user.name,
                'tty': user.terminal or 'console',
                'date': datetime.datetime.fromtimestamp(user.started).strftime('%Y-%m-%d'),
                'time': datetime.datetime.fromtimestamp(user.started).strftime('%H:%M:%S')
            })
    except Exception as e:
        logging.error(f"Error collecting users (psutil): {e}")

    # Method 2: quser (fallback if psutil returns empty or fails)
    if not users:
        try:
            import subprocess
            output = subprocess.check_output('quser', shell=True).decode('utf-8', errors='ignore')
            lines = output.strip().split('\n')
            # Skip header
            for line in lines[1:]:
                parts = line.split()
                if len(parts) >= 2:
                    username = parts[0].replace('>', '') # Remove active indicator
                    # Heuristic parsing since columns are fixed width but split breaks on spaces in dates
                    # We just want the username primarily
                    users.append({
                        'user': username,
                        'tty': 'console' if 'console' in line.lower() else 'rdp',
                        'date': datetime.datetime.now().strftime('%Y-%m-%d'), # Approx
                        'time': '00:00:00' # Unknown from simple split
                    })
        except Exception as e:
            logging.error(f"Error collecting users (quser): {e}")
            
    return users

def parse_wmi_date(wmi_date):
    """Converts WMI date string (YYYYMMDDHHMMSS...) to YYYY-MM-DD."""
    if not wmi_date or len(wmi_date) < 8: return "N/A"
    return f"{wmi_date[:4]}-{wmi_date[4:6]}-{wmi_date[6:8]}"

def get_detailed_hardware_info():
    """Collects static detailed system info using WMI (Windows) or psutil."""
    info = {
        'cpu': {},
        'ram': {},
        'gpu': [],
        'network': [],
        'motherboard': {},
        'system': {}
    }
    try:
        import wmi
        # Disable COM initialization if it's already initialized, or handle it
        try:
             import pythoncom
             pythoncom.CoInitialize()
        except: pass

        c = wmi.WMI()
        
        # CPU Details
        try:
            for processor in c.Win32_Processor():
                info['cpu'] = {
                    'name': processor.Name.strip(),
                    'cores': processor.NumberOfCores,
                    'logical': processor.NumberOfLogicalProcessors,
                    'socket': processor.SocketDesignation,
                    'l2_cache': f"{round(int(processor.L2CacheSize or 0)/1024, 1)} MB" if processor.L2CacheSize else "N/A",
                    'l3_cache': f"{round(int(processor.L3CacheSize or 0)/1024, 1)} MB" if processor.L3CacheSize else "N/A",
                    'virtualization': 'Enabled' if processor.VirtualizationFirmwareEnabled else 'Disabled'
                }
                break # Just take the first one for now
        except Exception as e:
            logging.error(f"WMI CPU error: {e}")

        # Motherboard - Try BaseBoard first, then ComputerSystem as fallback
        try:
            board = c.Win32_BaseBoard()[0]
            info['motherboard'] = {
                'manufacturer': board.Manufacturer,
                'product': board.Product,
                'serial': board.SerialNumber,
                'version': board.Version
            }
        except: 
            try:
                sys = c.Win32_ComputerSystem()[0]
                info['motherboard'] = {
                    'manufacturer': sys.Manufacturer,
                    'product': sys.Model,
                    'serial': "N/A", 
                    'version': "N/A"
                }
            except: info['motherboard'] = None

        # System UUID / Serial (often better than motherboard serial)
        try:
            csp = c.Win32_ComputerSystemProduct()[0]
            info['system'] = {
                'uuid': csp.UUID,
                'identifying_number': csp.IdentifyingNumber
            }
        except: 
            info['system'] = {'uuid': 'N/A', 'identifying_number': 'N/A'}

        # RAM Details
        try:
            ram_modules = []
            for mem in c.Win32_PhysicalMemory():
                ram_modules.append({
                    'capacity': f"{round(int(mem.Capacity)/(1024**3), 1)} GB",
                    'speed': f"{mem.Speed} MT/s",
                    'manufacturer': mem.Manufacturer,
                    'part_number': mem.PartNumber.strip(),
                    'form_factor': "DIMM" if mem.FormFactor == 8 else "SODIMM" if mem.FormFactor == 12 else "Unknown" 
                })
            info['ram']['modules'] = ram_modules
            info['ram']['slots_used'] = len(ram_modules)
        except Exception as e:
             logging.error(f"WMI RAM error: {e}")

        # GPU Details
        try:
            for gpu in c.Win32_VideoController():
                info['gpu'].append({
                    'name': gpu.Name,
                    'driver_version': gpu.DriverVersion,
                    'driver_date': parse_wmi_date(gpu.DriverDate),
                    'memory': f"{round(int(gpu.AdapterRAM or 0)/(1024**3), 1)} GB" if gpu.AdapterRAM else "Shared"
                })
        except Exception as e:
             logging.error(f"WMI GPU error: {e}")

        # Network Adapters - Relaxed logic to capture more interfaces
        try:
            net_info = []
            addrs = psutil.net_if_addrs()
            stats = psutil.net_if_stats()
            
            for interface, snics in addrs.items():
                if "loopback" in interface.lower(): continue
                
                ip = "N/A"
                mac = "N/A"
                for snic in snics:
                    if snic.family == socket.AF_INET:
                        ip = snic.address
                    elif snic.family == psutil.AF_LINK:
                        mac = snic.address
                
                # Include if it has a MAC address or an IP
                if mac != "N/A" or ip != "N/A":
                    speed = stats[interface].speed if interface in stats else 0
                    net_info.append({
                        'interface': interface,
                        'ip_address': ip,
                        'mac': mac,
                        'type': 'Ethernet' if 'thernet' in interface else 'Wi-Fi' if 'Wi-Fi' in interface or '802.11' in interface else 'Network',
                        'speed_mbps': speed
                    })
                    
            info['network'] = net_info
        except Exception as e:
            logging.error(f"Net info error: {str(e)}")
            info['network'] = []
            
    except Exception as e:
        logging.error(f"Error collecting detailed info: {e}")
    
    return info

def get_system_metrics():
    """Collects core hardware telemetry + Top Processes + Network Speed."""
    try:
        # Capture network counters BEFORE the 1-second CPU interval
        net_io_start = psutil.net_io_counters()
        
        # This blocks for 1 second to calculate CPU usage
        cpu = psutil.cpu_percent(interval=1)
        
        # Capture network counters AFTER the 1-second interval
        net_io_end = psutil.net_io_counters()
        
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Calculate Real-time Network Speed (Bytes -> KB/s)
        # Since interval is 1 second, the delta bytes *is* bytes/sec.
        bytes_sent = net_io_end.bytes_sent - net_io_start.bytes_sent
        bytes_recv = net_io_end.bytes_recv - net_io_start.bytes_recv
        
        network_up_kbps = round(bytes_sent / 1024, 1) # KB/s
        network_down_kbps = round(bytes_recv / 1024, 1) # KB/s



        # Check for active VPN (simplified check for common VPN adapter names)
        active_vpn = False
        addrs = psutil.net_if_addrs()
        for interface in addrs:
            if "tun" in interface.lower() or "tap" in interface.lower() or "vpn" in interface.lower():
                 if interface in psutil.net_if_stats() and psutil.net_if_stats()[interface].isup:
                     active_vpn = True
                     break

        disk_details = []
        for part in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(part.mountpoint)
                label = get_volume_label(part.mountpoint)
                disk_details.append({
                    'mount': part.mountpoint,
                     'device': part.device, 
                    'type': part.fstype,
                    'label': label,
                    'total_gb': round(usage.total / (1024**3), 2),
                    'used_gb': round(usage.used / (1024**3), 2),
                    'percent': usage.percent
                })
            except: pass

        return {
            "cpu_usage": cpu,
            "ram_usage": ram.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_details": disk_details,
            "processes": get_top_processes(15),
            "network_up_kbps": network_up_kbps,
            "network_down_kbps": network_down_kbps,
            "active_vpn": active_vpn,
            "ip_address": socket.gethostbyname(socket.gethostname())
        }
    except Exception as e:
        logging.error(f"Error collecting metrics: {e}")
        return None



def get_event_logs(last_check_time):
    """Query Windows Event Logs."""
    events = []
    server = 'localhost'
    flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
    
    for log_type in LOG_TYPES:
        try:
            hand = win32evtlog.OpenEventLog(server, log_type)
            objects = win32evtlog.ReadEventLog(hand, flags, 0)
            while objects:
                for obj in objects:
                    event_time = obj.TimeGenerated.replace(tzinfo=None)
                    if event_time < last_check_time: break 
                    if obj.EventID & 0xFFFF in TARGET_EVENT_IDS: 
                        events.append({
                            "event_id": obj.EventID & 0xFFFF,
                            "source": obj.SourceName,
                            "message": str(obj.StringInserts),
                            "severity": obj.EventType,
                            "timestamp": event_time.isoformat()
                        })
                if objects and objects[-1].TimeGenerated.replace(tzinfo=None) < last_check_time: break 
                objects = win32evtlog.ReadEventLog(hand, flags, 0)
            win32evtlog.CloseEventLog(hand)
        except Exception as e:
            if "privilege" in str(e).lower() or "access is denied" in str(e).lower():
                logging.warning(f"Permission denied reading {log_type} event log. Run as Administrator for full logs.")
            else:
                logging.error(f"Error reading {log_type} event log: {e}")
    return events

def send_payload(endpoint, data):
    headers = { "Content-Type": "application/json", "X-API-Key": API_KEY }
    try:
        response = requests.post(f"{API_URL}/{endpoint}", json=data, headers=headers, timeout=5)
        response.raise_for_status()
        logging.info(f"Successfully sent data to {endpoint}")
        return True
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to send data to {endpoint}: {e}")
        return False

def main():
    logging.info(f"Starting IT Manager Pro Agent on {MACHINE_ID}")
    last_event_check = datetime.datetime.now() - datetime.timedelta(hours=24)
    
    # Registration / First Heartbeat
    # Initial Handshake
    # machine_id = get_machine_id() # Assuming MACHINE_ID is already defined globally
    hostname = socket.gethostname()
    
    # Collect static details once
    detailed_info = get_detailed_hardware_info() # Use existing function
    
    # Basic hardware info (legacy format + new details)
    hardware_info = {
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "all_details": detailed_info # Nest the new deep details here
    }
    
    sys_info = {
        "id": MACHINE_ID,
        "hostname": hostname,
        "os_info": f"{platform.system()} {platform.release()}",
        "users": get_logged_in_users(),
        "hardware_info": hardware_info # Assign the new structured hardware_info
    }

    # The original `if hw_info:` block is now integrated into the `sys_info` construction above.
    # if hw_info:
    #     sys_info["hardware_info"] = hw_info
    #     logging.info("Collected detailed hardware info w/ Network.")
    logging.info("Collected detailed hardware info w/ Network.") # Keep the log message

    try:
        while True:
            metrics = get_system_metrics()
            if metrics:
                # Refresh users list periodically
                sys_info["users"] = get_logged_in_users()
                
                payload = { "machine": sys_info, "metrics": metrics }
                
                if (datetime.datetime.now() - last_event_check).total_seconds() >= EVENT_POLL_INTERVAL:
                    logging.info("Polling Event Logs...")
                    events = get_event_logs(last_event_check)
                    if events:
                        payload["events"] = events
                        logging.info(f"Found {len(events)} critical events.")
                    last_event_check = datetime.datetime.now()
                
                send_payload("telemetry", payload)
            
            time.sleep(TELEMETRY_INTERVAL)
            
    except KeyboardInterrupt:
        logging.info("Stopping agent...")

if __name__ == "__main__":
    main()
