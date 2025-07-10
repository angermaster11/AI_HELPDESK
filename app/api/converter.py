# 📁 app/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import numpy as np
import tempfile
import soundfile as sf
import uvicorn
import webrtcvad
import re

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Whisper model
model = WhisperModel("large", device="cuda", compute_type="float16")

# VAD init
vad = webrtcvad.Vad()
vad.set_mode(3)  # 3 = aggressive

# Stop/filler words to remove from final output
NOISE_WORDS = {
    "bye", "thank you", "ok", "okay", "hmm", "haan", "hm", "hmmm", "bye bye", "shukriya", "dhanyavaad"
}

def clean_transcript(text: str) -> str:
    """Remove filler noise/stop words and normalize."""
    # Lowercase and remove common stopwords
    text = text.lower()
    for word in NOISE_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        text = re.sub(pattern, '', text)

    # Remove extra spaces and non-speech leftovers
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# VAD check
def contains_voice(pcm_data, sample_rate=16000):
    frame_size = int(sample_rate * 0.02) * 2
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
                        audio_np = np.frombuffer(audio_chunks, dtype=np.int16)
                        sf.write(tmp.name, audio_np, 16000)

                        segments, _ = model.transcribe(
                            tmp.name,
                            beam_size=5,
                            language="hi",
                            initial_prompt="Speaker is using Indian English and Hindi mix. Avoid filler words like thank you, bye, okay. Transcribe clearly.",
                            vad_filter=True,
                            repetition_penalty=1.5,
                            no_repeat_ngram_size=2,
                            temperature=0.3,
                            compression_ratio_threshold=2.0
                        )

                    # Join and clean
                    full_text = " ".join([seg.text.strip() for seg in segments if seg.text.strip()])
                    full_text = clean_transcript(full_text)

                    if full_text and len(full_text.split()) > 1:
                        await websocket.send_text(full_text)
                    else:
                        print("🗑️ Ignored short/noisy text")

                else:
                    print("🤫 Skipping silence")

                audio_chunks = b""  # Clear buffer

    except WebSocketDisconnect:
        print("🔌 WebSocket closed")

    except Exception as e:
        print("❌ Error:", e)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
