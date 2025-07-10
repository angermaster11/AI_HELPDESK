# 📁 app/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import numpy as np
import tempfile
import soundfile as sf
import uvicorn
import webrtcvad

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper
model = WhisperModel("large", device="cuda", compute_type="float16")

# Init VAD
vad = webrtcvad.Vad()
vad.set_mode(3)  # Most aggressive

# Utility: Check if any 20ms frame has voice
def contains_voice(pcm_data, sample_rate=16000):
    frame_size = int(sample_rate * 0.02) * 2  # 20ms frame in bytes (int16 = 2 bytes)
    for i in range(0, len(pcm_data) - frame_size, frame_size):
        frame = pcm_data[i:i + frame_size]
        if vad.is_speech(frame, sample_rate):
            return True
    return False

@app.websocket("/ws/stt")
async def websocket_stt(websocket: WebSocket):
    await websocket.accept()
    audio_chunks = b""

    try:
        while True:
            data = await websocket.receive_bytes()
            audio_chunks += data

            if len(audio_chunks) >= 32000:  # ~1 sec
                if contains_voice(audio_chunks):
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                        # Convert int16 byte data to float32 audio for Whisper
                        audio_np = np.frombuffer(audio_chunks, dtype=np.int16)
                        sf.write(tmp.name, audio_np, 16000)

                        segments, _ = model.transcribe(
                            tmp.name,
                            beam_size=5,

                            initial_prompt="Indian English with Hindi influences and clean the text without repetitions.",
                            vad_filter=True,
                            repetition_penalty=1.5,
                            no_repeat_ngram_size=2,
                            temperature=0.3,
                            compression_ratio_threshold=2.0
                        )

                    full_text = " ".join([seg.text.strip() for seg in segments if seg.text.strip()])
                    if full_text:
                        await websocket.send_text(full_text)
                else:
                    print("🤫 Skipping silence")

                audio_chunks = b""  # Clear buffer

    except WebSocketDisconnect:
        print("🔌 WebSocket closed by user")

    except Exception as e:
        print("❌ WebSocket error:", e)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
