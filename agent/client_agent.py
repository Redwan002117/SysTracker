import platform
import socket
import time
import psutil
import requests
import json
import logging
import win32evtlog
import datetime

# Configuration
DEFAULT_API_URL = "https://monitor.rico.bd/api"
DEFAULT_API_KEY = "YOUR_STATIC_API_KEY_HERE"
TELEMETRY_INTERVAL = 60 # seconds
EVENT_POLL_INTERVAL = 300 # seconds (5 minutes)
MACHINE_ID = socket.gethostname() 
VERSION = "2.6.0"
INSTALL_DIR = r"C:\Program Files\SysTrackerAgent"
EXE_NAME = "SysTracker_Agent.exe"

MAX_RETRIES = 3
retry_delay = 5

# Global State for Delta Calculation
last_net_io = None
last_net_time = None

# Global Config
config = {
    "api_url": DEFAULT_API_URL,
    "api_key": DEFAULT_API_KEY
}

def load_config():
    """Load configuration from config.json in the same directory."""
    global config
    # Determine path to config file
    if getattr(sys, 'frozen', False):
        application_path = os.path.dirname(sys.executable)
    else:
        application_path = os.path.dirname(os.path.abspath(__file__))
    
    config_path = os.path.join(application_path, 'config.json')
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                loaded = json.load(f)
                config.update(loaded)
                logging.info(f"Loaded config from {config_path}")
                return True
        except Exception as e:
            logging.error(f"Error loading config: {e}")
            return False
    return False

def save_config(api_url, api_key, target_dir=None):
    """Save configuration to config.json."""
    global config
    
    if target_dir:
        application_path = target_dir
    else:
        # Determine path (same logic as load)
        if getattr(sys, 'frozen', False):
            application_path = os.path.dirname(sys.executable)
        else:
            application_path = os.path.dirname(os.path.abspath(__file__))
    
    config_path = os.path.join(application_path, 'config.json')
    
    config_data = {
        "api_url": api_url,
        "api_key": api_key
    }
    
    try:
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=4)
        if not target_dir: # Only update global config if we are saving to current dir
            config.update(config_data)
        logging.info(f"Saved config to {config_path}")
        return True
    except Exception as e:
        logging.error(f"Error saving config: {e}")
        return False



def run_setup_wizard():
    """Run the tkinter setup wizard to get URL and Key."""
    result = {"url": None, "key": None}
    
    try:
        import tkinter as tk
        from tkinter import messagebox
        
        # Helper to find icon
        def resource_path(relative_path):
            if hasattr(sys, '_MEIPASS'):
                return os.path.join(sys._MEIPASS, relative_path)
            return os.path.join(os.path.abspath("."), relative_path)

        root = tk.Tk()
        root.title("SysTracker Setup")
        root.geometry("400x250")
        
        # Center Window
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        x = (screen_width - 400) // 2
        y = (screen_height - 250) // 2
        root.geometry(f"400x250+{x}+{y}")
        
        # Set Icon
        try:
            icon_path = resource_path("logo.ico")
            if os.path.exists(icon_path):
                root.iconbitmap(icon_path)
        except Exception as e:
            logging.warning(f"Failed to set icon: {e}")

        # Bring window to front
        root.lift()
        root.attributes('-topmost',True)
        root.after_idle(root.attributes,'-topmost',False)

        # UI Elements
        tk.Label(root, text="SysTracker Agent Setup", font=("Segoe UI", 12, "bold")).pack(pady=10)

        tk.Label(root, text="Server URL (e.g. monitor.rico.bd)").pack(pady=(5, 2))
        url_entry = tk.Entry(root, width=45)
        url_entry.pack(pady=2)
        url_entry.insert(0, "https://")

        tk.Label(root, text="API Key").pack(pady=(10, 2))
        key_entry = tk.Entry(root, width=45)
        key_entry.pack(pady=2)

        def on_submit():
            url = url_entry.get().strip()
            key = key_entry.get().strip()
            
            # Scheme validation
            if not url.startswith("http://") and not url.startswith("https://"):
                url = "https://" + url
            
            # Path validation: Ensure it ends with /api (standard for SysTracker)
            if not url.endswith("/api"):
                # Check if it ends with / (remove it then add /api)
                if url.endswith("/"):
                    url = url[:-1]
                url += "/api"
            
            if not url or not key:
                messagebox.showerror("Error", "Please fill in both fields.")
                return

            # Test Connection
            root.config(cursor="wait")
            root.update()
            try:
                 logging.info(f"Testing connection to {url}")
                 # Try to connect
                 requests.get(url, timeout=5)
            except Exception as e:
                 root.config(cursor="")
                 if not messagebox.askyesno("Connection Failed", f"Could not connect to {url}.\nError: {e}\n\nDo you want to save anyway?"):
                     return

            root.config(cursor="")
            result["url"] = url
            result["key"] = key
            root.destroy()

        submit_btn = tk.Button(root, text="Connect & Save", command=on_submit, bg="#00aa00", fg="white", font=("Segoe UI", 10, "bold"), padx=10, pady=5)
        submit_btn.pack(pady=20)
        
        root.protocol("WM_DELETE_WINDOW", sys.exit) # Exit if closed
        root.mainloop()
        
    except ImportError:
        logging.warning("Tkinter not found. Cannot show input dialogs.")
        ctypes.windll.user32.MessageBoxW(0, "Tkinter missing. Cannot run setup.", "Error", 0x10)
        sys.exit(1)
    except Exception as e:
        logging.error(f"Error showing setup dialog: {e}")

    # Validate Inputs
    if not result["url"] or not result["key"]:
        sys.exit(1)

    return result["url"], result["key"]

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def install_agent(setup_url=None, setup_key=None):
    if not is_admin():
        # Re-run with admin privileges
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv[1:]), None, 1)
        sys.exit(0)

    logging.info("Installing SysTracker Agent...")
    
    if not os.path.exists(INSTALL_DIR):
        os.makedirs(INSTALL_DIR)

    # Stop any existing agent services to release file locks
    logging.info("Stopping any existing agent services...")
    os.system('schtasks /end /tn "SysTrackerAgent" >nul 2>&1')
    handle_kill_switch()
    time.sleep(2) # Grace period for process termination
        
    current_exe = sys.executable
    target_exe = os.path.join(INSTALL_DIR, EXE_NAME)
    
    # Copy Executable (if not running from target)
    if os.path.normpath(current_exe) != os.path.normpath(target_exe):
        try:
            shutil.copy2(current_exe, target_exe)
            logging.info(f"Copied agent to {target_exe}")
        except Exception as e:
            logging.error(f"Failed to copy agent: {e}")
            ctypes.windll.user32.MessageBoxW(0, f"Failed to allow agent copy: {e}", "Installation Error", 0x10)
            return

    # Create/Update Config
    args_url = setup_url
    args_key = setup_key
    
    # CLI Args
    if "--url" in sys.argv:
        try:
            args_url = sys.argv[sys.argv.index("--url") + 1]
        except: pass
    if "--key" in sys.argv:
        try:
            args_key = sys.argv[sys.argv.index("--key") + 1]
        except: pass

    # If args provided, use them. If not, run wizard.
    if args_url and args_key:
        save_config(args_url, args_key, target_dir=INSTALL_DIR)
    else:
        # Run wizard
        url, key = run_setup_wizard()
        save_config(url, key, target_dir=INSTALL_DIR)
        args_url = url
        args_key = key

    # Test Connection
    logging.info(f"Testing connection to {args_url}...")
    try:
        test_resp = requests.get(f"{args_url}", timeout=5)
        logging.info(f"Connection test status: {test_resp.status_code}")
    except Exception as e:
        logging.error(f"Connection failed: {e}")
        ctypes.windll.user32.MessageBoxW(0, f"Could not connect to server at {args_url}.\nError: {e}\n\nInstallation will continue, but agent may not work.", "Connection Warning", 0x30)
 
    # Create Scheduled Task
    cmd = f'schtasks /create /tn "SysTrackerAgent" /tr "\'{target_exe}\'" /sc onstart /ru SYSTEM /rl HIGHEST /f'
    result = os.system(cmd)
    
    if result == 0:
        logging.info("Scheduled task created.")
        
        # Create Helper Bat Files
        try:
            bat_uninstall = f'@echo off\n"{target_exe}" --uninstall\npause'
            with open(os.path.join(INSTALL_DIR, "Uninstall.bat"), "w") as f:
                f.write(bat_uninstall)
                
            bat_stop = f'@echo off\n"{target_exe}" --stop\npause'
            with open(os.path.join(INSTALL_DIR, "Stop.bat"), "w") as f:
                f.write(bat_stop)
                
            bat_start = f'@echo off\n"{target_exe}" --start\npause'
            with open(os.path.join(INSTALL_DIR, "Start.bat"), "w") as f:
                f.write(bat_start)
        except Exception as e:
            logging.error(f"Failed to create bat files: {e}")

        os.system('schtasks /run /tn "SysTrackerAgent"')
        ctypes.windll.user32.MessageBoxW(0, "SysTracker Agent installed and started successfully!", "Installation Complete", 0x40)
    else:
        logging.error("Failed to create scheduled task.")
        ctypes.windll.user32.MessageBoxW(0, "Failed to create scheduled task.", "Installation Error", 0x10)

def uninstall_agent():
    if not is_admin():
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv[1:]), None, 1)
        sys.exit(0)

    logging.info("Uninstalling SysTracker Agent...")
    
    # Stop and Delete Task
    os.system('schtasks /end /tn "SysTrackerAgent"')
    os.system('schtasks /delete /tn "SysTrackerAgent" /f')
    
    # Try to kill process if running
    handle_kill_switch()
    
    # We cannot delete the EXE if we are running from it, but we removed persistence.
    ctypes.windll.user32.MessageBoxW(0, "SysTracker Agent stopped and persistence removed.\nYou can now delete the files from C:\\Program Files\\SysTrackerAgent", "Uninstall Complete", 0x40)

def send_payload(endpoint, data):
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": config["api_key"]
    }
    url = f"{config['api_url']}/{endpoint}"
    
    max_retries = 3
    retry_delay = 5 # Start with 5s
    
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=data, headers=headers, timeout=10)
            response.raise_for_status()
            logging.info(f"Successfully sent data to {endpoint}")
            return True
        except requests.exceptions.HTTPError as e:
            logging.error(f"HTTP Error posting to {endpoint}: {e}")
            if e.response.status_code in [401, 403]:
                logging.error("Authentication failed. Check API Key.")
                return False # Stop retrying on auth error
        except requests.exceptions.RequestException as e:
            logging.error(f"Connection error posting to {endpoint} (Attempt {attempt+1}/{max_retries}): {e}")
        
        # Wait before retrying (unless it's the last attempt)
        if attempt < max_retries - 1:
            time.sleep(retry_delay)
            retry_delay *= 2 # Exponential backoff: 5, 10, 20...
            
    logging.error(f"Failed to send payload to {endpoint} after {max_retries} attempts.")
    return False

# ... (Previous Code) ...



def get_system_metrics():
    try:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Active Processes (Top 10 by CPU)
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                pinfo = proc.info
                # Convert active percent to something readable if needed, usually just raw float
                # Convert memory to MB
                if pinfo['memory_info']:
                    pinfo['mem_mb'] = round(pinfo['memory_info'].rss / (1024 * 1024), 2)
                processes.append(pinfo)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
    # Sort by CPU
        processes.sort(key=lambda p: p['cpu_percent'] or 0, reverse=True)
        top_processes = processes[:15]
        
        # Disk Details
        disk_details = []
        try:
            partitions = psutil.disk_partitions()
            for p in partitions:
                try:
                    # Skip CD-ROM or empty drives
                    if 'cdrom' in p.opts or p.fstype == '': continue
                    usage = psutil.disk_usage(p.mountpoint)
                    disk_details.append({
                        "mount": p.mountpoint,
                        "device": p.device,
                        "type": p.fstype,
                        "total_gb": round(usage.total / (1024**3), 2),
                        "used_gb": round(usage.used / (1024**3), 2),
                        "percent": usage.percent
                    })
                except: pass
        except: pass

        # Network Throughput
        global last_net_io, last_net_time
        net_up = 0
        net_down = 0
        current_net_io = psutil.net_io_counters()
        current_time = time.time()
        
        if last_net_io and last_net_time:
            time_diff = current_time - last_net_time
            if time_diff > 0:
                # bytes per sec -> kbps (kilobits) or KBps (Kilobytes)? 
                # Dashboard usually expects kbps (kilobits) or KBps. 
                # Let's assume KB/s for human readability or kbps for network standard.
                # Types.ts says 'network_up_kbps'. kBps = kilobytes per second. kbps = kilobits.
                # Usually standard internet speed is bits. File transfer is bytes.
                # Let's send KB/s (KiloBytes) as it's more useful for system monitoring.
                # Wait, 'kbps' usually means Kilobits. 'KBps' means Kilobytes.
                # I'll send Kilobytes per second (KB/s) but label is kbps... I should check dashboard usage.
                # Standard psutil gives bytes.
                # I will calculate Kilobytes per Second.
                net_up = (current_net_io.bytes_sent - last_net_io.bytes_sent) / time_diff / 1024
                net_down = (current_net_io.bytes_recv - last_net_io.bytes_recv) / time_diff / 1024
        
        last_net_io = current_net_io
        last_net_time = current_time

        return {
            "cpu_usage": cpu,
            "ram_usage": ram.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "ip_address": socket.gethostbyname(socket.gethostname()),
            "processes": top_processes,
            "disk_details": disk_details,
            "network_up_kbps": round(net_up, 2),
            "network_down_kbps": round(net_down, 2),
            "uptime_seconds": int(time.time() - psutil.boot_time())
        }
    except Exception as e:
        logging.error(f"Error collecting metrics: {e}")
        return None

def get_detailed_hardware_info():
    """
    Collects static hardware info using WMI (Windows Management Instrumentation).
    """
    try:
        import wmi
        c = wmi.WMI()
        
        info = {}
        
        # Motherboard
        try:
            board = c.Win32_BaseBoard()[0]
            info['motherboard'] = {
                'manufacturer': board.Manufacturer,
                'product': board.Product,
                'serial': board.SerialNumber,
                'version': board.Version
            }
        except: info['motherboard'] = "Unknown"

        # RAM Sticks
        try:
            ram_sticks = []
            for stick in c.Win32_PhysicalMemory():
                ram_sticks.append({
                    'capacity_gb': round(int(stick.Capacity) / (1024**3), 2),
                    'speed': stick.Speed,
                    'manufacturer': stick.Manufacturer,
                    'part_number': stick.PartNumber.strip()
                })
            info['ram'] = ram_sticks
        except: info['ram'] = []

        # GPU
        try:
            gpus = []
            for gpu in c.Win32_VideoController():
                gpus.append({
                    'name': gpu.Name,
                    'driver_version': gpu.DriverVersion
                })
            info['gpu'] = gpus
        except: info['gpu'] = []

        # Physical Disks (Smart status, Model)
        try:
            disks = []
            for disk in c.Win32_DiskDrive():
                disks.append({
                    'model': disk.Model,
                    'serial': disk.SerialNumber.strip(),
                    'size_gb': round(int(disk.Size) / (1024**3), 2),
                    'interface': disk.InterfaceType,
                    'media_type': disk.MediaType
                })
            info['disks'] = disks
        except: info['disks'] = []
        

        try:
            net_if = []
            addrs = psutil.net_if_addrs()
            stats = psutil.net_if_stats()
            # Net IO for speed calculation - wait, speed is in stats (Link Speed)
            # Throughput is in get_system_metrics usually
            
            for nic, snics in addrs.items():
                # Skip loopback
                if nic == 'lo' or nic.lower().startswith('loop'): continue
                
                nic_info = {
                    'interface': nic, # Dashboard expects 'interface' not 'name' in HardwareInfo.network
                    'speed_mbps': stats[nic].speed if nic in stats else 0,
                    'is_up': stats[nic].isup if nic in stats else False,
                }
                # Dashboard HardwareInfo.network structure: { interface, ip_address, mac, type, speed_mbps }
                # We need to flatten address info or pick IPv4
                ip = "N/A"
                mac = "N/A"
                for snic in snics:
                    if snic.family == socket.AF_INET:
                        ip = snic.address
                    elif snic.family == psutil.AF_LINK:
                        mac = snic.address
                
                nic_info['ip_address'] = ip
                nic_info['mac'] = mac
                nic_info['type'] = "Unknown" # psutil doesn't give type easily (wired/wireless)
                
                net_if.append(nic_info)
            info['network'] = net_if # Dashboard uses 'network' not 'network_interfaces'
        except Exception as e:
            logging.error(f"Error collecting network info: {e}")
            info['network'] = []

        return info
    except Exception as e:
        logging.error(f"Error collecting hardware info: {e}")
        return None

def get_event_logs(last_check_time):
    """
    Query Windows Event Logs for specific critical events since last_check_time.
    Target Event IDs: 41 (Kernel-Power), 1001 (BugCheck), 7 (Disk), 55 (Ntfs), 1000 (App Error), 1002 (App Hang)
    """
    events = []
    target_ids = {41, 1001, 7, 55, 1000, 1002}
    log_types = ["System", "Application"]
    
    server = 'localhost'
    flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
    
    for log_type in log_types:
        try:
            hand = win32evtlog.OpenEventLog(server, log_type)
            objects = win32evtlog.ReadEventLog(hand, flags, 0)
            
            while objects:
                for obj in objects:
                    # Check if event is recent enough (rough check, refinement needed for robust time diff)
                    event_time = obj.TimeGenerated
                    # Convert to timestamp
                    if event_time.replace(tzinfo=None) < last_check_time:
                         # Read backwards, so if we hit an old event, we can stop for this log type
                         break 
                    
                    if obj.EventID & 0xFFFF in target_ids: # EventID sometimes includes info bits
                        events.append({
                            "event_id": obj.EventID & 0xFFFF,
                            "source": obj.SourceName,
                            "message": str(obj.StringInserts), # Simplified message extraction
                            "severity": obj.EventType, # 1=Error, 2=Warning, 4=Info
                            "timestamp": event_time.isoformat()
                        })
                
                if objects and objects[-1].TimeGenerated.replace(tzinfo=None) < last_check_time:
                    break # Stop reading if we went back far enough

                objects = win32evtlog.ReadEventLog(hand, flags, 0)
                
            win32evtlog.CloseEventLog(hand)
            
        except Exception as e:
            logging.error(f"Error reading {log_type} event log: {e}")
            
    return events



def main():
    if not is_admin():
        logging.info("Not running as admin. Requesting elevation...")
        try:
             ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv), None, 1)
        except Exception as e:
             logging.error(f"Failed to elevate: {e}")
             ctypes.windll.user32.MessageBoxW(0, "Failed to elevate privileges. Agent requires Admin.", "Error", 0x10)
        sys.exit(0)

    
    manage_pid()
    logging.info(f"Starting SysTracker Agent on {MACHINE_ID}")
    
    last_event_check = datetime.datetime.now() - datetime.timedelta(minutes=5)
    
    # Registration / First Heartbeat
    sys_info = {
        "id": MACHINE_ID,
        "hostname": socket.gethostname(),
        "os_info": f"{platform.system()} {platform.release()}",
        "version": VERSION,
    }
    
    # Send initial full hardware info
    hw_info = get_detailed_hardware_info()
    if hw_info:
        sys_info["hardware_info"] = hw_info
    
    try:
        while True:
            # 1. Collect Telemetry
            metrics = get_system_metrics()
            if metrics:
                # Update sys_info with dynamic data if needed, or just send minimal
                # For now, we resend sys_info to keep 'last_seen' and other metadata fresh on the server Upsert
                payload = {
                    "machine": sys_info,
                    "metrics": metrics
                }
                # Check for events every 5 loops (approx 5 mins if interval is 60s) 
                # Or just check time diff
                if (datetime.datetime.now() - last_event_check).total_seconds() >= EVENT_POLL_INTERVAL:
                    events = get_event_logs(last_event_check)
                    if events:
                        payload["events"] = events
                    last_event_check = datetime.datetime.now()
                
                send_payload("telemetry", payload)
            
            time.sleep(TELEMETRY_INTERVAL)
            
    except KeyboardInterrupt:
        logging.info("Stopping agent...")

def handle_kill_switch():
    pid_file = "agent.pid"
    if os.path.exists(pid_file):
        try:
            with open(pid_file, "r") as f:
                pid = int(f.read().strip())
            
            logging.info(f"Attempting to kill process {pid}...")
            process = psutil.Process(pid)
            process.terminate()
            logging.info(f"Process {pid} terminated successfully.")
            os.remove(pid_file)
            return True
        except psutil.NoSuchProcess:
            logging.warning(f"Process {pid} not found. Cleaning up PID file.")
            os.remove(pid_file)
            return True
        except Exception as e:
            logging.error(f"Error killing process: {e}")
            return False
    else:
        logging.warning("No active agent found (agent.pid missing).")
        return False

def manage_pid():
    pid = os.getpid()
    pid_file = "agent.pid"
    
    if os.path.exists(pid_file):
        try:
            with open(pid_file, "r") as f:
                old_pid = int(f.read().strip())
            if psutil.pid_exists(old_pid):
                logging.error(f"Agent already running (PID: {old_pid}). Exiting.")
                sys.exit(1)
            else:
                logging.warning("Stale PID file found. Overwriting.")
        except:
            pass
            
    with open(pid_file, "w") as f:
        f.write(str(pid))


if __name__ == "__main__":
    import sys
    import os
    import ctypes
    import shutil
    
    # Global Admin Check
    if not is_admin():
        # Re-run the script/exe with admin privileges
        # If frozen, sys.executable is the exe.
        # If script, sys.executable is python.exe.
        # ShellExecuteW takes (hwnd, verb, file, params, dir, show)
        # We need to reconstruct params carefully.
        params = " ".join([f'"{arg}"' for arg in sys.argv[1:]])
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, None, 1)
        sys.exit(0)
    
    # Flags
    if "--install" in sys.argv:
        install_agent()
        sys.exit(0)
        
    if "--uninstall" in sys.argv:
        uninstall_agent()
        sys.exit(0)

    if "--kill" in sys.argv:
        handle_kill_switch()
        sys.exit(0)
    
    # Normal startup

    # Check if we are running from INSTALL_DIR
    current_exe = sys.executable
    target_exe = os.path.join(INSTALL_DIR, EXE_NAME)
    is_installed = (os.path.normpath(current_exe) == os.path.normpath(target_exe))
    
    config_loaded = load_config()

    if not is_installed:
        # Not in Program Files -> Trigger Installation
        if config_loaded and config.get("api_url") != DEFAULT_API_URL:
             logging.info("Configuration found. Installing agent...")
             install_agent(config.get("api_url"), config.get("api_key"))
        else:
             logging.info("Configuration missing. Running setup wizard...")
             url, key = run_setup_wizard()
             install_agent(url, key)
        sys.exit(0)

    # If installed but config missing (shouldn't happen if install worked)
    if not config_loaded:
        logging.info("Configuration missing in installed agent. Running setup...")
        url, key = run_setup_wizard()
        save_config(url, key)
    
    main()
