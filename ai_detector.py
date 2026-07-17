import cv2
from ultralytics import YOLO
import edge_tts
import asyncio
import os
import time
import threading
import serial
import serial.tools.list_ports
import re

classes = ["colored", "clear", "opaque"]
thai_labels = {
    "colored": "ตรวจพบขวดสีชา", 
    "clear": "ตรวจพบขวดใส",
    "opaque": "ตรวจพบขวดสีขุ่น"
}

# Generate audio files if they don't exist
async def setup_audio():
    os.makedirs("./sound/type_bottle_sound", exist_ok=True)
    for c, th_text in thai_labels.items():
        filename = f"./sound/type_bottle_sound/{c}_th.mp3"
        if not os.path.exists(filename):
            try:
                communicate = edge_tts.Communicate(th_text, "th-TH-PremwadeeNeural")
                await communicate.save(filename)
            except Exception as e:
                print(f"TTS Error: {e}")

# Run audio setup once
try:
    asyncio.run(setup_audio())
except:
    pass

class BottleDetector:
    def __init__(self, callback=None):
        """
        callback: ฟังก์ชันที่จะถูกเรียกเมื่อตรวจพบขวด 
        รูปแบบ: callback(bottle_type, weight)
        """
        self.callback = callback
        self.is_running = False
        self.thread = None
        self.cooldown = 2.0
        # ใช้ Relative path เผื่อย้ายเครื่อง
        self.model_path = os.path.join("app", "bottle_model.pt")
        self.model = None

        self.current_weight = 0.0
        self.serial_thread = None
        self.serial_port = None

    def _read_serial_loop(self):
        # ค้นหาพอร์ต COM ที่ใช้งานได้ (หรือจะกำหนดตายตัวก็ได้)
        ports = list(serial.tools.list_ports.comports())
        for p in ports:
            if "COM" in p.device:
                self.serial_port = p.device
                break
        
        if not self.serial_port:
            import platform
            if platform.system() == "Windows":
                self.serial_port = "COM3"
            else:
                self.serial_port = "/dev/ttyUSB0"

        while self.is_running:
            try:
                with serial.Serial(self.serial_port, 115200, timeout=1) as ser:
                    print(f"Connected to Scale on {self.serial_port}")
                    while self.is_running:
                        if ser.in_waiting > 0:
                            line = ser.readline().decode('utf-8', errors='ignore').strip()
                            # ใช้ regex หาตัวเลขทศนิยมหรือจำนวนเต็มในข้อความ 
                            # เผื่อกรณีพิมพ์ว่า "Raw = 123 Weight = 15.5 g" ก็จะได้ 15.5 มา
                            matches = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                            if matches:
                                try:
                                    # เอาตัวเลขตัวสุดท้าย (ซึ่งน่าจะเป็นน้ำหนัก)
                                    self.current_weight = float(matches[-1])
                                except ValueError:
                                    pass
                        time.sleep(0.01)
            except Exception as e:
                # ลองเชื่อมต่อใหม่ทุกๆ 2 วินาทีหากสายหลุด
                time.sleep(2)

    def start(self):
        if self.is_running:
            return
        
        if self.model is None:
            try:
                self.model = YOLO(self.model_path)
            except Exception as e:
                print(f"Failed to load YOLO model: {e}")
                return

        self.is_running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        
        self.serial_thread = threading.Thread(target=self._read_serial_loop, daemon=True)
        self.serial_thread.start()
        
        print("AI Detector & Scale Started in background.")

    def stop(self):
        self.is_running = False
        if self.thread is not None and self.thread != threading.current_thread():
            self.thread.join(timeout=2.0)
        print("AI Detector Stopped.")

    def _run_loop(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Cannot open camera")
            self.is_running = False
            return

        last_play_time = 0

        while self.is_running:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue

            results = self.model.track(frame, persist=True, verbose=False)

            detected_classes = []
            if results[0].boxes is not None and len(results[0].boxes) > 0:
                for box in results[0].boxes:
                    cls_id = int(box.cls[0])
                    cls_name = self.model.names[cls_id]
                    detected_classes.append(cls_name)

            if detected_classes:
                target_class = detected_classes[0]
                current_time = time.time()
                
                if current_time - last_play_time > self.cooldown:
                    if target_class in classes:
                        last_play_time = current_time

                        # 2. แปลงชื่อ class ให้ตรงกับฐานข้อมูล (clear, opaque, brown)
                        db_bottle_type = target_class
                        if target_class == "colored":
                            db_bottle_type = "brown"
                        
                        # 3. ส่งข้อมูลกลับไปให้ Flet นำไปยิง API (และเล่นเสียง)
                        if self.callback:
                            # ดึงน้ำหนักล่าสุดจากตราชั่งมาใช้ (ถ้าไม่ถึง 1 กรัม ให้ปัดเป็น 1 เพื่อป้องกันไม่ได้แต้ม)
                            weight = max(1.0, self.current_weight) 
                            # เพิ่มการส่ง target_class เดิมกลับไปให้ flet เล่นเสียง
                            self.callback(db_bottle_type, weight, target_class)

            time.sleep(0.03) # ลดภาระ CPU

        cap.release()
