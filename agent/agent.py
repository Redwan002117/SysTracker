import platform
import socket
import time
import psutil
import socketio

# Configuration
SERVER_URL = 'http://localhost:3001'
RECONNECT_DELAY = 5

# Initialize Socket.IO client
sio = socketio.Client()

def get_system_info():
    return {
        'id': socket.gethostname(), # Simple ID for now
        'hostname': socket.gethostname(),
        'ip': socket.gethostbyname(socket.gethostname()),
        'os': f"{platform.system()} {platform.release()}"
    }

def get_metrics():
    return {
        'id': socket.gethostname(),
        'cpu': psutil.cpu_percent(interval=1),
        'ram': psutil.virtual_memory().percent,
        'disk': psutil.disk_usage('/').percent
    }

@sio.event
def connect():
    print("Connected to server")
    info = get_system_info()
    sio.emit('register', info)

@sio.event
def connect_error(data):
    print(f"The connection failed: {data}")

@sio.event
def disconnect():
    print("Disconnected from server")

def main():
    while True:
        try:
            sio.connect(SERVER_URL)
            break
        except Exception as e:
            print(f"Connection failed: {e}. Retrying in {RECONNECT_DELAY}s...")
            time.sleep(RECONNECT_DELAY)

    try:
        while True:
            if sio.connected:
                metrics = get_metrics()
                sio.emit('metrics', metrics)
                #print(f"Sent metrics: {metrics}")
                time.sleep(5)
            else:
                print("Socket not connected, attempting reconnect...")
                try:
                    sio.connect(SERVER_URL)
                except:
                    time.sleep(RECONNECT_DELAY)
    except KeyboardInterrupt:
        print("Stopping agent...")
        sio.disconnect()

if __name__ == '__main__':
    main()
