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
        
        # Get transcript and feedback using stt_llm_tts.get_feedback
        transcript = None
        feedback = None
        try:
            from backend.stt_llm_tts import get_feedback
            
            # Relative path from project root
            relative_path = os.path.relpath(filepath, PROJECT_ROOT)
            result = get_feedback(relative_path)
            
            if result and isinstance(result, list) and len(result) >= 2:
                transcript = result[0]
                feedback = result[1]
            else:
                # Fallback: just get transcript if get_feedback doesn't work as expected
                transcript = result[0] if result and len(result) > 0 else None
        except Exception as e:
            print(f'Error getting feedback: {e}')
            # Try to at least get transcript
            try:
                transcript = transcribe_audio_file(filepath)
            except Exception as e2:
                print(f'Error transcribing audio: {e2}')
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'message': f'Audio saved to {filepath}',
            'transcript': transcript,
            'feedback': feedback
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def transcribe_audio_file(file_path: str):
    """Transcribe audio file using stt_llm_tts.get_transcript."""
    try:
        # Use subprocess to call modal run, which will output logs + transcript
        relative_path = os.path.relpath(file_path, PROJECT_ROOT)
        result = subprocess.run(
            ['python', '-m', 'modal', 'run', 'backend.modal_parakeet', '--file-path', relative_path],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            # Parse output to extract just the transcript text
            # The transcript is printed after all Modal logs
            output_lines = result.stdout.strip().split('\n')
            
            # Find the line after "Stopping app - local entrypoint completed."
            # or after "✓ App completed" - that should be the transcript
            transcript = None
            found_completion = False
            
            for i, line in enumerate(output_lines):
                line = line.strip()
                # Look for completion markers
                if 'Stopping app' in line and 'local entrypoint completed' in line:
                    found_completion = True
                    # The transcript should be on the next non-empty line
                    for j in range(i + 1, len(output_lines)):
                        next_line = output_lines[j].strip()
                        if next_line and not next_line.startswith('✓'):
                            transcript = next_line
                            break
                    break
                elif line.startswith('✓ App completed'):
                    found_completion = True
                    # The transcript should be on the next non-empty line
                    for j in range(i + 1, len(output_lines)):
                        next_line = output_lines[j].strip()
                        if next_line:
                            transcript = next_line
                            break
                    break
            
            # If we didn't find completion marker, look for the last line that's not a Modal log
            if not transcript:
                for line in reversed(output_lines):
                    line = line.strip()
                    if not line:
                        continue
                    # Skip Modal-specific lines
                    if (line.startswith('✓') or line.startswith('├──') or line.startswith('└──') or
                        line.startswith('╭') or line.startswith('╰') or line.startswith('│') or
                        'Modal' in line or 'View run at' in line or 'Initialized' in line or
                        'Created' in line or '/usr/local' in line or 'site-packages' in line or
                        'Warning' in line or 'Deprecation' in line or 'Device set to' in line or
                        'Stopping app' in line or 'FutureWarning' in line or 'warnings.warn' in line or
                        'bug fix' in line or 'multilingual Whisper' in line or
                        'Passing a tuple' in line or 'EncoderDecoderCache' in line):
                        continue
                    # This should be the transcript
                    transcript = line
                    break
            
            return transcript if transcript else None
        else:
            print(f'Transcription error: {result.stderr}')
            return None
    except subprocess.TimeoutExpired:
        print('Transcription timed out')
        return None
    except Exception as e:
        print(f'Error transcribing audio: {e}')
        return None

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

