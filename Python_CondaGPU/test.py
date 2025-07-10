import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel
import queue
import time
import requests  # ✅ NEW

# Whisper setup
model = WhisperModel("large", device="cuda", compute_type="float16")

SAMPLE_RATE = 16000
BUFFER_DURATION = 5
OVERLAP_DURATION = 0.5
VOLUME_THRESHOLD = 0.02

AUDIO_Q = queue.Queue()
last_text = ""

# 🎤 Audio callback
def audio_callback(indata, frames, time_info, status):
    if status:
        print(status)
    AUDIO_Q.put(indata.copy())

# 🤖 Send to chatbot and get reply
def ask_chatbot(query):
    try:
        res = requests.post("http://localhost:8000/chat", json={"input": query})
        if res.status_code == 200:
            return res.json().get("output", "❌ No response.")
        else:
            return f"❌ Error {res.status_code}"
    except Exception as e:
        return f"❌ Failed to connect: {e}"

# 🚀 Transcription loop
def start_stream():
    audio_buffer = []
    print("🎤 Speak now... (Ctrl+C to stop)\n")

    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="float32", callback=audio_callback):
        while True:
            try:
                audio_block = AUDIO_Q.get()
                audio_buffer.append(audio_block)

                total_samples = sum(block.shape[0] for block in audio_buffer)
                if total_samples >= SAMPLE_RATE * BUFFER_DURATION:
                    combined = np.concatenate(audio_buffer, axis=0).flatten()

                    # Keep overlap for smoother cut
                    overlap_samples = int(SAMPLE_RATE * OVERLAP_DURATION)
                    audio_buffer = [combined[-overlap_samples:].reshape(-1, 1)]

                    # Skip silence
                    volume = np.linalg.norm(combined)
                    if volume < VOLUME_THRESHOLD:
                        continue

                    # Transcribe
                    segments, _ = model.transcribe(combined, beam_size=5)

                    global last_text
                    for seg in segments:
                        text = seg.text.strip()
                        if text and text != "." and text != last_text:
                            print(f"📝 You: {text}")
                            last_text = text

                            # ✅ Ask chatbot
                            reply = ask_chatbot(text)
                            print(f"🤖 Bot: {reply}\n")

            except KeyboardInterrupt:
                print("\n🛑 Stopped by user.")
                break

if __name__ == "__main__":
    start_stream()
