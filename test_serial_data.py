import serial
import time
import serial.tools.list_ports

ports = list(serial.tools.list_ports.comports())
com_port = None
for p in ports:
    if "COM" in p.device:
        com_port = p.device
        break

if not com_port:
    com_port = "COM3"

try:
    print(f"Connecting to {com_port} at 115200 baud...")
    ser = serial.Serial(com_port, 115200, timeout=1)
    
    end_time = time.time() + 3
    while time.time() < end_time:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            print("Weight data:", line)
            
    ser.close()
    print("Done")
except Exception as e:
    print("Error:", e)
