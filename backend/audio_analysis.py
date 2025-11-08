
import parselmouth
import librosa
import numpy as np
from pydub import AudioSegment

def analyze_speech(wav_file):
    # ----- Load audio -----
    y, sr = librosa.load(wav_file, sr=None)  # y = waveform, sr = sample rate
    duration_sec = librosa.get_duration(y=y, sr=sr)
    
    # ----- Pitch analysis using parselmouth -----
    snd = parselmouth.Sound(wav_file)
    pitch = snd.to_pitch()
    pitch_values = pitch.selected_array['frequency']
    pitch_values = pitch_values[(pitch_values > 50) & (pitch_values < 500)]  # remove unvoiced parts
    
    pitch_mean = np.mean(pitch_values)
    pitch_sd = np.std(pitch_values)
    
    # Convert pitch SD to semitones relative to mean
    pitch_sd_st = 12 * np.log2(pitch_values / pitch_mean)
    pitch_sd_st = np.std(pitch_sd_st)
    
    # ----- Loudness (RMS in dB) using pydub -----
    audio = AudioSegment.from_wav(wav_file)
    loudness_db = audio.dBFS  # average loudness
    # approximate SD using samples
    samples = np.array(audio.get_array_of_samples())
    samples = samples / (2**15)  # normalize 16-bit PCM
    loudness_sd = 20 * np.log10(np.std(samples) + 1e-6)
    
    # ----- Speech rate (WPM) approximation -----
    # Using librosa to detect syllable-like events via onset detection
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
    syllable_count = len(onsets)
    words_per_minute = (syllable_count / 2.0) / (duration_sec / 60)  # approx 1.5 syllables per word
    
    # ----- Results -----
    # print(f"Duration: {duration_sec:.2f} sec")
    # print(f"Pitch: mean = {pitch_mean:.2f} Hz, SD = {pitch_sd:.2f} Hz, SD (semitones) = {pitch_sd_st:.2f} st")
    # print(f"Loudness: mean = {loudness_db:.2f} dBFS, SD ~ {loudness_sd:.2f} dB")
    # print(f"Approx. speech rate: {words_per_minute:.2f} WPM")

    if pitch_sd_st < 1:
        pitch_assessment = "are too monotone"
    elif pitch_sd_st > 5:
        pitch_assessment = "are overly dramatic"
    else:
        pitch_assessment = "have good pitch variation"

    # Speech rate
    if words_per_minute < 150:
        rate_assessment = "too slowly"
    elif words_per_minute > 200:
        rate_assessment = "too fast"
    else:
        rate_assessment = "at a good pace"

    # Loudness
    if loudness_db < -25:
        loudness_assessment = "too quiet"
    elif loudness_db > -5:
        loudness_assessment = "too loud"
    else:
        loudness_assessment = "speaking at a good volume"

    # ----- Results -----
    # print(f"Duration: {duration_sec:.2f} sec")
    # if()
    # print(f"Pitch: mean = {pitch_mean:.2f} Hz, SD = {pitch_sd:.2f} Hz, SD (semitones) = {pitch_sd_st:.2f} st ({pitch_assessment})")
    # print(f"Loudness: mean = {loudness_db:.2f} dB, SD = {loudness_sd:.2f} dB ({loudness_assessment})")
    # print(f"Approx. speech rate: {words_per_minute:.2f} WPM ({rate_assessment})")
    return f"Based on your speech, you {pitch_assessment}. Also, you are speaking {rate_assessment} and you are {loudness_assessment}."

# Example usage
# analyze_speech("./audiotests/recording_with_issues.wav")