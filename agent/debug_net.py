import psutil
import socket

print("--- Network Interfaces (psutil) ---")
addrs = psutil.net_if_addrs()
stats = psutil.net_if_stats()

for interface, snics in addrs.items():
    print(f"\nInterface: {interface}")
    if interface in stats:
        print(f"  Status: {'Up' if stats[interface].isup else 'Down'}")
        print(f"  Speed: {stats[interface].speed} Mbps")
    
    for snic in snics:
        if snic.family == socket.AF_INET:
            print(f"  IPv4: {snic.address}")
        elif snic.family == psutil.AF_LINK:
            print(f"  MAC: {snic.address}")

print("\n--- IO Counters ---")
io = psutil.net_io_counters()
print(f"Bytes Sent: {io.bytes_sent}")
print(f"Bytes Recv: {io.bytes_recv}")
