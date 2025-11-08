from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
from glob import glob

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
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'message': f'Audio saved to {filepath}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

