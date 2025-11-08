from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
from glob import glob
import subprocess

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Get the project root directory (parent of backend)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_TESTS_DIR = os.path.join(PROJECT_ROOT, 'audiotests')

# Ensure audiotests directory exists
os.makedirs(AUDIO_TESTS_DIR, exist_ok=True)

def get_next_recording_number():
    """Find the highest existing recording number and return the next one."""
    pattern = os.path.join(AUDIO_TESTS_DIR, 'user_recording_#*.wav')
    existing_files = glob(pattern)
    
    max_number = 0
    for filepath in existing_files:
        filename = os.path.basename(filepath)
        # Extract number from filename like "user_recording_#1.wav"
        match = re.search(r'user_recording_#(\d+)\.wav', filename)
        if match:
            number = int(match.group(1))
            max_number = max(max_number, number)
    
    return max_number + 1

@app.route('/api/upload-audio', methods=['POST'])
def upload_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        if audio_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Generate filename with sequential number
        next_number = get_next_recording_number()
        filename = f'user_recording_#{next_number}.wav'
        filepath = os.path.join(AUDIO_TESTS_DIR, filename)
        
        # Save the file
        audio_file.save(filepath)
        
        # Transcribe the audio using modal_parakeet
        transcript = None
        try:
            transcript = transcribe_audio_file(filepath)
        except Exception as e:
            print(f'Error transcribing audio: {e}')
            # Continue even if transcription fails
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'message': f'Audio saved to {filepath}',
            'transcript': transcript
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def transcribe_audio_file(file_path: str):
    """Transcribe audio file using stt_llm_tts.get_transcript."""
    try:
        # Import and use get_transcript from stt_llm_tts
        from backend.stt_llm_tts import get_transcript
        
        # Use the get_transcript function which uses modal_parakeet internally
        # Relative path from project root
        relative_path = os.path.relpath(file_path, PROJECT_ROOT)
        transcript = get_transcript(relative_path)
        return transcript
    except ImportError as e:
        print(f'Error importing stt_llm_tts: {e}')
        # Fallback to modal_parakeet directly
        try:
            from backend.modal_parakeet import transcribe_audio
            relative_path = os.path.relpath(file_path, PROJECT_ROOT)
            transcript = transcribe_audio(relative_path)
            return transcript
        except ImportError:
            # Fallback to subprocess if direct import doesn't work
            try:
                relative_path = os.path.relpath(file_path, PROJECT_ROOT)
                result = subprocess.run(
                    ['python', '-m', 'modal', 'run', 'backend.modal_parakeet', '--file-path', relative_path],
                    cwd=PROJECT_ROOT,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute timeout
                )
                
                if result.returncode == 0:
                    # Extract transcript from output
                    output = result.stdout.strip()
                    # Try to parse JSON if it's JSON, otherwise return as text
                    try:
                        import json
                        parsed = json.loads(output)
                        if isinstance(parsed, dict) and 'text' in parsed:
                            return parsed['text']
                        return output
                    except:
                        return output
                else:
                    print(f'Transcription error: {result.stderr}')
                    return None
            except subprocess.TimeoutExpired:
                print('Transcription timed out')
                return None
            except Exception as e:
                print(f'Error running transcription: {e}')
                return None
    except Exception as e:
        print(f'Error transcribing audio: {e}')
        return None

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

