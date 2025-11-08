# Voice Settings Guide:
# - stability (0.0-1.0): Lower values = more expressive/emotional, Higher values = more consistent
# - similarity_boost (0.0-1.0): How closely the output matches the original voice
# - style (0.0-1.0): Style exaggeration - higher values = more expressive intonation
# - use_speaker_boost: Enhances similarity to the original speaker

from elevenlabs import ElevenLabs
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

client = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)


def generate_speech_to_file(
    text: str,
    output_path: str = "output.wav",
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb",
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.0,
    use_speaker_boost: bool = True,
    output_format: str = "mp3_44100_128"  # Options: "mp3_44100_128", "pcm_16000", "pcm_22050", "pcm_24000", "pcm_44100", "ulaw_8000"
):
    """
    Generate speech using ElevenLabs and save to audio file.
    
    Args:
        text: Text to convert to speech
        output_path: Path to save the audio file (extension should match format)
        voice_id: ElevenLabs voice ID
        model_id: Model to use (e.g., "eleven_multilingual_v2", "eleven_turbo_v2")
        stability: Voice stability (0.0-1.0). Lower = more expressive, Higher = more consistent
        similarity_boost: Similarity to original voice (0.0-1.0). Higher = closer to original
        style: Style exaggeration (0.0-1.0). Higher = more expressive intonation
        use_speaker_boost: Enhance similarity to the original speaker
        output_format: Audio format. Use "pcm_44100" for WAV, or "mp3_44100_128" for MP3
    
    Returns:
        Path to the saved audio file
    """
    # Create output directory if it doesn't exist
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate audio using the generate method (better for file saving)
    audio = client.text_to_speech.generate(
        text=text,
        voice=voice_id,
        model=model_id,
        output_format=output_format,
        voice_settings={
            "stability": stability,
            "similarity_boost": similarity_boost,
            "style": style,
            "use_speaker_boost": use_speaker_boost
        }
    )
    
    # Save audio to file
    with open(output_path, "wb") as f:
        for chunk in audio:
            if chunk:
                f.write(chunk)
    
    print(f"Audio saved to: {output_path}")
    return output_path


def generate_speech_stream_to_file(
    text: str,
    output_path: str = "output.wav",
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb",
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.0,
    use_speaker_boost: bool = True
):
    """
    Generate speech using streaming API and save to file (alternative method).
    Useful for real-time processing or very long texts.
    
    Args:
        text: Text to convert to speech
        output_path: Path to save the audio file
        voice_id: ElevenLabs voice ID
        model_id: Model to use
        stability: Voice stability (0.0-1.0)
        similarity_boost: Similarity to original voice (0.0-1.0)
        style: Style exaggeration (0.0-1.0)
        use_speaker_boost: Enhance similarity to the original speaker
    
    Returns:
        Path to the saved audio file
    """
    # Create output directory if it doesn't exist
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate audio stream with voice settings
    audio_stream = client.text_to_speech.stream(
        text=text,
        voice_id=voice_id,
        model_id=model_id,
        voice_settings={
            "stability": stability,
            "similarity_boost": similarity_boost,
            "style": style,
            "use_speaker_boost": use_speaker_boost
        }
    )
    
    # Collect audio chunks and save to file
    with open(output_path, "wb") as f:
        for chunk in audio_stream:
            if chunk:
                f.write(chunk)
    
    print(f"Audio saved to: {output_path}")
    return output_path


# Example usage with different voice styles
if __name__ == "__main__":
    # Professional/Formal style (stable, clear) - MP3 format
    generate_speech_to_file(
        text="Welcome to today's presentation. We'll be discussing the key findings from our research.",
        output_path="audio/professional.mp3",
        stability=0.7,  # More consistent
        similarity_boost=0.8,  # Closer to original voice
        style=0.2,  # Less exaggerated
        use_speaker_boost=True,
        output_format="mp3_44100_128"
    )
    
    # Expressive/Emotional style - Using audio tags for emotion
    generate_speech_to_file(
        text="I'm so excited to share this amazing news with you all! [excited] This is incredible!",
        output_path="audio/expressive.mp3",
        stability=0.3,  # More variable/emotional
        similarity_boost=0.7,
        style=0.8,  # More exaggerated intonation
        use_speaker_boost=True,
        output_format="mp3_44100_128"
    )
    
    # Conversational/Casual style
    generate_speech_to_file(
        text="Hey there! So, I was thinking about what we discussed earlier, and I have some thoughts.",
        output_path="audio/conversational.mp3",
        stability=0.5,  # Balanced
        similarity_boost=0.75,
        style=0.4,  # Moderately expressive
        use_speaker_boost=True,
        output_format="mp3_44100_128"
    )
    
    # Academic/Thoughtful style - WAV format (PCM)
    generate_speech_to_file(
        text="In examining the theoretical framework, we observe that the empirical evidence suggests a correlation between these variables.",
        output_path="audio/academic.wav",
        stability=0.6,  # More stable
        similarity_boost=0.8,
        style=0.1,  # Less exaggerated, more measured
        use_speaker_boost=True,
        output_format="pcm_44100"  # PCM format for WAV (raw audio, may need WAV headers)
    )
    
    # Example: High-quality WAV for professional use
    generate_speech_to_file(
        text="This is a high-quality audio recording suitable for professional presentations.",
        output_path="audio/high_quality.wav",
        stability=0.65,
        similarity_boost=0.85,
        style=0.3,
        use_speaker_boost=True,
        output_format="pcm_44100"
    )
