import sounddevice as sd
import scipy.io.wavfile as wav
import threading
import os

# Config
RATE = 44100
CHANNELS = 1
OUTPUT = os.path.join(os.path.dirname(__file__), "../../audio/recording.wav")

recording = []
stop_flag = threading.Event()

def record():
    with sd.InputStream(samplerate=RATE, channels=CHANNELS, dtype='int16') as stream:
        while not stop_flag.is_set():
            data, _ = stream.read(1024)
            recording.append(data)

print("Recording... Press 'q' + Enter to stop")
thread = threading.Thread(target=record)
thread.start()

while input() != 'q':
    pass

stop_flag.set()
thread.join()

import numpy as np
data = np.concatenate(recording)
wav.write(OUTPUT, RATE, data)
print(f"Saved to {OUTPUT}")