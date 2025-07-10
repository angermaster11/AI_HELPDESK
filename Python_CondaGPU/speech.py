import pyaudio
import numpy as np
import torch
from faster_whisper import WhisperModel

# Initialize the Faster Whisper model
model_size = "large"  # You can choose between tiny, base, small, medium, large models
model = WhisperModel(model_size, device="cuda" if torch.cuda.is_available() else "cpu")

# Parameters for microphone
RATE = 16000  # Sample rate (must match the microphone sample rate)
CHUNK = 1024  # Size of the audio chunk
FORMAT = pyaudio.paInt16  # Format of audio stream
CHANNELS = 1  # Mono channel
FRAMES_PER_BUFFER = CHUNK

# Initialize the microphone stream
p = pyaudio.PyAudio()
stream = p.open(format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK)

print("Start speaking...")

# Real-time audio capture and transcription
try:
    while True:
        # Read audio chunk from microphone
        audio_data = np.frombuffer(stream.read(CHUNK), dtype=np.int16)

        # Transcribe the captured audio using Faster Whisper
        segments, info = model.transcribe(audio_data, language="en", fp16=False)
        
        # Process the transcribed segments
        for segment in segments:
            print(f"Transcription: {segment.text}")

except KeyboardInterrupt:
    print("\nStopping transcription...")
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
