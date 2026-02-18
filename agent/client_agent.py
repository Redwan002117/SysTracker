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
API_URL = "https://monitor.rico.bd/api"
API_KEY = "YOUR_STATIC_API_KEY_HERE"
TELEMETRY_INTERVAL = 60 # seconds
EVENT_POLL_INTERVAL = 300 # seconds (5 minutes)
MACHINE_ID = socket.gethostname() # Using Hostname as ID for simplicity, typically MAC or UUID is better
VERSION = "2.0.2"

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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

def send_payload(endpoint, data):
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }
    try:
        response = requests.post(f"{API_URL}/{endpoint}", json=data, headers=headers, timeout=5)
        response.raise_for_status()
        logging.info(f"Successfully sent data to {endpoint}")
        return True
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to send data to {endpoint}: {e}")
        return False

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

if __name__ == "__main__":
    main()
