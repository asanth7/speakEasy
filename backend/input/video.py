import cv2
import numpy as np
import os

# Define output path
OUTPUT = os.path.join(os.path.dirname(__file__), "../../video/video_file.array")

# Ensure the directory exists
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

# Initialize video capture
cap = cv2.VideoCapture(0)

# List to store frames
frames = []

print("Recording... Press 'q' + Enter to stop and save.")

q_pressed = False

while cap.isOpened():
    ret, frame = cap.read()
    
    if not ret:
        print("Failed to grab frame")
        break
    
    # Store the frame
    frames.append(frame)
    
    # Display the frame
    cv2.imshow('Webcam', frame)
    
    # Check for 'q' key press in the OpenCV window
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        q_pressed = True
        print("'q' pressed. Now press Enter in the terminal to stop and save...")
    
    # Check for Enter key in the OpenCV window (only if 'q' was pressed)
    if q_pressed and key == 13:  # 13 is the Enter key
        break

# Release resources
cap.release()
cv2.destroyAllWindows()

# Convert frames list to numpy array and save
if frames:
    frames_array = np.array(frames)
    np.save(OUTPUT, frames_array)
    print(f"Saved {len(frames)} frames to {OUTPUT}.npy")
    print(f"Array shape: {frames_array.shape}")
else:
    print("No frames captured")