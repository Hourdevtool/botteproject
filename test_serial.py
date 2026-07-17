import serial
import time

try:
    # Most MicroPython ESP32 boards use 115200 baud rate
    ser = serial.Serial('COM3', 115200, timeout=1)
    print("Connected to COM3. Reading data...")
    
    start_time = time.time()
    # Read for 3 seconds
    while time.time() - start_time < 3:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            print("Received:", line)
            
    ser.close()
    print("Finished reading.")
except Exception as e:
    print("Error:", e)
