"""
Script to capture video from camera and send frames to Modal VLM endpoint
for analysis of speaker expressiveness and posture.
"""
import cv2
import numpy as np
import base64
import json
import urllib.request
import ssl
import os
import time
from io import BytesIO
from PIL import Image
from datetime import datetime


def encode_frame(frame):
    """Encode a frame (numpy array) to base64 string."""
    # Convert BGR to RGB (OpenCV uses BGR, PIL uses RGB)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Convert to PIL Image
    pil_image = Image.fromarray(frame_rgb)
    
    # Convert to bytes
    buffer = BytesIO()
    pil_image.save(buffer, format="JPEG", quality=85)
    image_bytes = buffer.getvalue()
    
    # Encode to base64
    return base64.b64encode(image_bytes).decode("utf-8")


def capture_and_analyze(
    modal_url: str,
    question: str = """You are an expert debate coach. Based on the user's video input, how would you evaluate their delivery in terms of the following:

- Posture: Are they standing confidently, or do they lean, slouch, or shift excessively?
- Hand Gestures: Are their gestures natural and supportive, or distracting, repetitive, or minimal?
- Eye Contact: Do they consistently engage with the audience/camera, or look away too often?
- Vocal Intensity: Does their tone convey confidence and clarity, or is it monotone, overly aggressive, or lacking projection?
- Facial Expression: Are their expressions appropriate, expressive, or inconsistent with their message?
- Overall Presence: Do they appear confident, persuasive, and engaged?

After assessing each category, what 2–3 concrete suggestions would you give to help them improve?""",
    duration_seconds: float = 15.0,
    fps_limit: int = 30,
    output_file: str = None,
):
    """
    Capture video frames from camera and send to Modal for analysis.
    
    Args:
        modal_url: URL of the Modal endpoint (from analyze_video)
        question: Question to ask about the video frames
        duration_seconds: Duration to capture video (in seconds)
        fps_limit: Capture every Nth frame (30 = one frame per second at 30fps, reduces token usage)
        output_file: Path to save JSON output (default: analysis_TIMESTAMP.json)
    """
    print("Initializing camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open camera")
        return
    
    # Set camera properties
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    # Get actual FPS from camera
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0  # Default to 30 FPS if camera doesn't report it
    
    frames = []
    frame_count = 0
    captured_count = 0
    
    # Start timing
    start_time = time.time()
    end_time = start_time + duration_seconds
    
    print(f"\nRecording for {duration_seconds} seconds... Press 'q' to stop early.")
    print(f"Capturing every {fps_limit} frame(s) at ~{fps:.1f} FPS (approximately 1 frame per second)")
    print(f"Expected frames: ~{int(duration_seconds * fps / fps_limit)}")
    
    while cap.isOpened():
        current_time = time.time()
        elapsed_time = current_time - start_time
        remaining_time = duration_seconds - elapsed_time
        
        # Check if duration has elapsed
        if current_time >= end_time:
            print(f"\n{duration_seconds} seconds elapsed. Stopping capture...")
            break
        
        ret, frame = cap.read()
        
        if not ret:
            print("Failed to grab frame")
            break
        
        # Only capture every Nth frame
        if frame_count % fps_limit == 0:
            frames.append(frame)
            captured_count += 1
            # Update display with time remaining
            print(f"Recording... {elapsed_time:.1f}s / {duration_seconds:.1f}s | Frames: {captured_count} | Remaining: {remaining_time:.1f}s", end="\r")
        
        # Display the frame with timer overlay
        display_frame = frame.copy()
        cv2.putText(display_frame, f"Time: {elapsed_time:.1f}s / {duration_seconds:.1f}s", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(display_frame, f"Frames: {captured_count}", 
                   (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.imshow("Camera - Press 'q' to stop", display_frame)
        
        # Check for 'q' key press
        if cv2.waitKey(1) & 0xFF == ord("q"):
            print(f"\n'q' pressed. Stopped after {elapsed_time:.1f} seconds.")
            break
        
        frame_count += 1
    
    # Release resources
    cap.release()
    cv2.destroyAllWindows()
    
    if not frames:
        print("No frames captured")
        return
    
    actual_duration = time.time() - start_time
    print(f"\nCaptured {len(frames)} frames in {actual_duration:.1f} seconds. Encoding and sending to Modal...")
    
    # Encode frames to base64
    encoded_frames = []
    for i, frame in enumerate(frames):
        encoded_frame = encode_frame(frame)
        encoded_frames.append(encoded_frame)
        if (i + 1) % 5 == 0:
            print(f"Encoded {i + 1}/{len(frames)} frames", end="\r")
    
    print(f"\nSending {len(encoded_frames)} frames to Modal endpoint...")
    
    # Prepare payload
    payload = json.dumps(
        {
            "frames": encoded_frames,
            "question": question,
        }
    )
    
    # Send to Modal
    req = urllib.request.Request(
        modal_url,
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    
    try:
        # Create SSL context for HTTPS requests (fixes SSL certificate verification errors)
        ssl_context = ssl._create_unverified_context()
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            assert response.getcode() == 200, f"HTTP {response.getcode()}"
            result = json.loads(response.read().decode())
            
            # Add metadata to result
            result["metadata"] = {
                "timestamp": datetime.now().isoformat(),
                "duration_seconds": actual_duration,
                "frames_captured": len(frames),
                "question": question,
                "modal_url": modal_url
            }
            
            print("\n" + "=" * 80)
            print("VIDEO ANALYSIS RESULTS")
            print("=" * 80)
            print(f"\nRequest ID: {result.get('request_id')}")
            print(f"Total frames captured: {result.get('total_frames')}")
            print(f"Frames analyzed: {result.get('frames_processed', result.get('frames_observed', 'N/A'))}")
            if result.get('sample_rate'):
                print(f"Sample rate: {result.get('sample_rate')}")
            print("\n" + "-" * 80)
            print("OVERALL ASSESSMENT:")
            print("-" * 80)
            
            # Get overall analysis from results
            overall_analysis = None
            if "results" in result and len(result["results"]) > 0:
                # Check for overall_analysis in results
                for res in result["results"]:
                    if "overall_analysis" in res:
                        overall_analysis = res["overall_analysis"]
                        break
            
            # Fallback to combined_analysis if available
            if not overall_analysis:
                overall_analysis = result.get("combined_analysis", "No analysis available")
            
            print(overall_analysis)
            print("\n" + "=" * 80)
            
            # Generate output filename if not provided
            if output_file is None:
                # Get the directory where this script is located (backend folder)
                script_dir = os.path.dirname(os.path.abspath(__file__))
                # Go up one level to the parent directory
                parent_dir = os.path.dirname(script_dir)
                # Create info_json_output folder path
                output_dir = os.path.join(parent_dir, "info_json_output")
                
                # Create the directory if it doesn't exist
                os.makedirs(output_dir, exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = os.path.join(output_dir, f"analysis_{timestamp}.json")
            
            # Write result to JSON file
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            print(f"\nResults saved to: {output_file}")
            print("=" * 80)
            
            return result
            
    except Exception as e:
        print(f"\nError sending request to Modal: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    import sys
    
    # You need to provide the Modal endpoint URL
    # You can get it by running: modal deploy sgl_vlm.py
    # Then check the Modal dashboard for the endpoint URL
    # Or use: modal app show example-sgl-vlm
    
    if len(sys.argv) > 1:
        modal_url = sys.argv[1]
        print(f"DEBUG: Using Modal URL: '{modal_url}'")
        print(f"DEBUG: URL length: {len(modal_url)}")
    else:
        print("Usage: python process_video_camera.py <modal_endpoint_url> [output_file.json]")
        print("\nTo get the endpoint URL:")
        print("1. Deploy the Modal app: modal deploy backend/sgl_vlm.py")
        print("2. Get the URL from Modal dashboard or use: modal app show example-sgl-vlm")
        print("3. Look for the 'analyze_video' endpoint URL")
        print("   It should be something like: https://<workspace>--example-sgl-vlm-model-analyze-video.modal.run")
        print("\nAlternatively, you can use the Modal Python API:")
        print("   from backend.sgl_vlm import app, Model")
        print("   model = Model()")
        print("   url = model.analyze_video.get_web_url()")
        print("\nOptional: Specify output JSON file as second argument (default: analysis_TIMESTAMP.json)")
        sys.exit(1)
    
    # Get optional output file from command line
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    question = """
You are an expert debate coach in ENGLISH (output in ENGLISH). Based on the user's video input, can you evaluate their delivery for each frame using the following categories, giving a rating of "high", "medium", or "low" for each?

- Posture: Are they standing confidently, balanced, and upright, or do they lean, slouch, sway, or shift excessively?
- Hand Gestures: Are gestures natural, supportive, and purposeful, or are they distracting, repetitive, rigid, or minimal?
- Eye Contact: Do they maintain consistent engagement with the audience/camera, or do they look away too often, down, or off-screen?
- Vocal Intensity: Is their vocal delivery confident, clear, well-projected, and dynamic, or is it monotone, overly aggressive, or lacking presence?
- Facial Expression: Are their expressions expressive and aligned with their message, or are they flat, tense, or inconsistent?
- Overall Presence: Do they appear persuasive, confident, focused, and engaged?

Additionally, can you evaluate the speaker in terms of:
- Intensity (energy and emotional impact)
- Confidence (steadiness, comfort, assertiveness)
- Presence (audience engagement and ability to command attention)

Please output ONLY a JSON object in this exact structure:

{
  "Posture": "",
  "Hand Gestures": "",
  "Eye Contact": "",
  "Vocal Intensity": "",
  "Facial Expression": "",
  "Overall Presence": "",
  "Intensity": "",
  "Confidence": "",
  "Presence": ""
}

Each field should contain the rating "high", "medium", or "low" for that frame.

After evaluating all frames, can you also give 2–3 specific and actionable suggestions to help improve their delivery, keeping the suggestions practical, short, and realistic?"""
    
    capture_and_analyze(modal_url, question=question, output_file=output_file)