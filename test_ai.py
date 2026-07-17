import ai_detector
import time

def my_callback(b_type, weight, target):
    print("Detected:", b_type, weight)

detector = ai_detector.BottleDetector(callback=my_callback)
detector.start()

time.sleep(10)
detector.stop()
