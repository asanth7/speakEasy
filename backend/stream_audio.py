import sounddevice as sd
import soundfile as sf
import numpy as np
import queue

SAMPLE_RATE = 16000
CHANNELS = 1
# NOTE: Currently overwrites the existing audio file --> change so that we store all audio files for users to listen to
OUTPUT_FILE = "audiotests/user_recording.wav" 

q = queue.Queue()

def callback(indata, frames, time, status):
    if status:
        print(status)
    q.put(indata.copy())

# Open a stream that runs until you stop it
with sf.SoundFile(OUTPUT_FILE, mode='w', samplerate=SAMPLE_RATE,
                  channels=CHANNELS, subtype='PCM_16') as f:
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS,
                        dtype='int16', callback=callback):
        print("Recording... Press Ctrl+C to stop.")
        try:
            while True:
                f.write(q.get())
        except KeyboardInterrupt:
            print("\nRecording stopped.")


