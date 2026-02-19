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
VERSION = "2.4.0"
INSTALL_DIR = r"C:\Program Files\SysTrackerAgent"
EXE_NAME = "SysTracker_Agent.exe"

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
        except Exception as e:
            logging.error(f"Error loading config: {e}")

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def install_agent():
    if not is_admin():
        # Re-run with admin privileges
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv[1:]), None, 1)
        sys.exit(0)

    logging.info("Installing SysTracker Agent...")
    
    if not os.path.exists(INSTALL_DIR):
        os.makedirs(INSTALL_DIR)
        
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
    args_url = None
    args_key = None
    
    # CLI Args
    if "--url" in sys.argv:
        try:
            args_url = sys.argv[sys.argv.index("--url") + 1]
        except: pass
    if "--key" in sys.argv:
        try:
            args_key = sys.argv[sys.argv.index("--key") + 1]
        except: pass

    # Tkinter Input (if args missing)
    if not args_url or not args_key:
        try:
            import tkinter as tk
            from tkinter import simpledialog
            
            root = tk.Tk()
            root.withdraw() # Hide main window

            if not args_url:
                args_url = simpledialog.askstring("SysTracker Setup", "Enter Server URL (e.g. http://192.168.1.100:7777):")
            
            if not args_key:
                args_key = simpledialog.askstring("SysTracker Setup", "Enter API Key:")
            
            root.destroy()
        except ImportError:
            logging.warning("Tkinter not found. Cannot show input dialogs.")

    # Validate Inputs
    if not args_url:
        args_url = DEFAULT_API_URL
    if not args_key:
        args_key = DEFAULT_API_KEY

    # Test Connection
    logging.info(f"Testing connection to {args_url}...")
    try:
        # Check /api/auth/status or just root /
        # We don't have a dedicated health check for agents without auth, 
        # but we can try to hit the URL.
        test_resp = requests.get(f"{args_url}", timeout=5)
        logging.info(f"Connection test status: {test_resp.status_code}")
    except Exception as e:
        logging.error(f"Connection failed: {e}")
        ctypes.windll.user32.MessageBoxW(0, f"Could not connect to server at {args_url}.\nError: {e}\n\nInstallation will continue, but agent may not work.", "Connection Warning", 0x30)
 
    config_data = {
        "api_url": args_url,
        "api_key": args_key
    }
    
    with open(os.path.join(INSTALL_DIR, "config.json"), "w") as f:
        json.dump(config_data, f, indent=4)
        
    # Create Scheduled Task
    # schtasks /create /tn "SysTrackerAgent" /tr "'C:\...\SysTracker_Agent.exe'" /sc onstart /ru SYSTEM /rl HIGHEST /f
    cmd = f'schtasks /create /tn "SysTrackerAgent" /tr "\'{target_exe}\'" /sc onstart /ru SYSTEM /rl HIGHEST /f'
    result = os.system(cmd)
    
    if result == 0:
        logging.info("Scheduled task created.")
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
    try:
        response = requests.post(f"{config['api_url']}/{endpoint}", json=data, headers=headers, timeout=5)
        response.raise_for_status()
        logging.info(f"Successfully sent data to {endpoint}")
        return True
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to send data to {endpoint}: {e}")
        return False

# ... (Previous Code) ...



def get_system_metrics():
    try:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_usage": cpu,
            "ram_usage": ram.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "ip_address": socket.gethostbyname(socket.gethostname())
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
    manage_pid()
    load_config() # Load config before starting
    main()
