import cv2
import time

start_time = time.time()
print("Testing camera 0 without DSHOW...")
cap = cv2.VideoCapture(0)
if cap.isOpened():
    print("Camera 0 opened successfully in", time.time() - start_time, "seconds")
    ret, frame = cap.read()
    if ret:
        print("Read frame successfully.")
    else:
        print("Failed to read frame.")
    cap.release()
else:
    print("Failed to open camera 0 in", time.time() - start_time, "seconds")
