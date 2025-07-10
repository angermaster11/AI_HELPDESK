import os
from google.cloud import speech
import io

# Initialize the Speech client
client = speech.SpeechClient()

def transcribe_audio(audio_path):
    """Transcribes audio file to text"""
    
    # Read the audio file
    with io.open(audio_path, "rb") as audio_file:
        content = audio_file.read()

    # Configure the audio file for transcription
    audio = speech.RecognitionAudio(content=content)

    # Configure the recognition settings (can customize for different languages)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code="en-US",  # Change to your preferred language code
    )

    # Perform speech recognition
    response = client.recognize(config=config, audio=audio)

    # Print the transcriptions
    for result in response.results:
        print("Transcript: {}".format(result.alternatives[0].transcript))

if __name__ == "__main__":
    audio_file_path = "audios.wav"  # Path to the audio file
    transcribe_audio(audio_file_path)
