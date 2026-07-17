import cv2
print("Testing camera 0...")
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
if cap.isOpened():
    print("Camera 0 opened successfully.")
    ret, frame = cap.read()
    if ret:
        print("Read frame successfully.")
    else:
        print("Failed to read frame.")
    cap.release()
else:
    print("Failed to open camera 0.")

print("Testing camera 1...")
cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
if cap.isOpened():
    print("Camera 1 opened successfully.")
    ret, frame = cap.read()
    if ret:
        print("Read frame successfully.")
    else:
        print("Failed to read frame.")
    cap.release()
else:
    print("Failed to open camera 1.")
