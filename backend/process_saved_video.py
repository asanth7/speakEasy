"""
Script to load saved video frames and send them to Modal VLM endpoint
for analysis of speaker expressiveness and posture.
"""
import numpy as np
import base64
import json
import urllib.request
import os
from io import BytesIO
from PIL import Image
from pathlib import Path


def encode_frame(frame):
    """Encode a frame (numpy array) to base64 string."""
    # Convert to PIL Image (assuming frames are already in RGB format)
    # If frames are in BGR format, convert: frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    if frame.dtype != np.uint8:
        frame = (frame * 255).astype(np.uint8)
    
    pil_image = Image.fromarray(frame)
    
    # Convert to bytes
    buffer = BytesIO()
    pil_image.save(buffer, format="JPEG", quality=85)
    image_bytes = buffer.getvalue()
    
    # Encode to base64
    return base64.b64encode(image_bytes).decode("utf-8")


def load_and_analyze(
    video_file: str,
    modal_url: str,
    question: str = """You are an expert debate coach. Based on the user's video input, how would you evaluate their delivery in terms of the following:

- Posture: Are they standing confidently, or do they lean, slouch, or shift excessively?
- Hand Gestures: Are their gestures natural and supportive, or distracting, repetitive, or minimal?
- Eye Contact: Do they consistently engage with the audience/camera, or look away too often?
- Vocal Intensity: Does their tone convey confidence and clarity, or is it monotone, overly aggressive, or lacking projection?
- Facial Expression: Are their expressions appropriate, expressive, or inconsistent with their message?
- Overall Presence: Do they appear confident, persuasive, and engaged?

After assessing each category, what 2–3 concrete suggestions would you give to help them improve?""",
    max_frames: int = None,
    sample_rate: int = 30,
):
    """
    Load saved video frames and send to Modal for analysis.
    
    Args:
        video_file: Path to the saved .npy file containing video frames
        modal_url: URL of the Modal endpoint (from analyze_video)
        question: Question to ask about the video frames
        max_frames: Maximum number of frames to process (None = process all sampled frames)
        sample_rate: Process every Nth frame (30 = one frame per second at 30fps, reduces token usage)
    """
    video_path = Path(video_file)
    
    if not video_path.exists():
        print(f"Error: Video file not found: {video_file}")
        return None
    
    print(f"Loading video frames from {video_file}...")
    
    try:
        frames_array = np.load(video_file)
        print(f"Loaded video array with shape: {frames_array.shape}")
    except Exception as e:
        print(f"Error loading video file: {str(e)}")
        return None
    
    # Handle different array shapes: (frames, height, width, channels) or (frames, channels, height, width)
    if len(frames_array.shape) == 4:
        if frames_array.shape[1] == 3 or frames_array.shape[1] == 1:
            # Shape is (frames, channels, height, width) - transpose to (frames, height, width, channels)
            frames_array = np.transpose(frames_array, (0, 2, 3, 1))
    else:
        print(f"Unexpected array shape: {frames_array.shape}")
        return None
    
    # Sample frames (every 30 frames = ~1 frame per second at 30fps)
    total_frames = len(frames_array)
    if sample_rate and sample_rate > 1:
        frames_to_process = frames_array[::sample_rate]
    else:
        frames_to_process = frames_array
    
    if max_frames:
        frames_to_process = frames_to_process[:max_frames]
    
    print(f"Processing {len(frames_to_process)} frames (sampled every {sample_rate} frames from {total_frames} total frames)")
    print(f"This represents approximately {len(frames_to_process) * sample_rate / 30:.1f} seconds of video at 30fps")
    print(f"Encoding frames...")
    
    # Encode frames to base64
    encoded_frames = []
    for i, frame in enumerate(frames_to_process):
        try:
            encoded_frame = encode_frame(frame)
            encoded_frames.append(encoded_frame)
            if (i + 1) % 5 == 0:
                print(f"Encoded {i + 1}/{len(frames_to_process)} frames", end="\r")
        except Exception as e:
            print(f"\nError encoding frame {i}: {str(e)}")
            continue
    
    if not encoded_frames:
        print("No frames were successfully encoded")
        return None
    
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
        with urllib.request.urlopen(req) as response:
            assert response.getcode() == 200, f"HTTP {response.getcode()}"
            result = json.loads(response.read().decode())
            
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
            
            return result
            
    except Exception as e:
        print(f"\nError sending request to Modal: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python process_saved_video.py <video_file.npy> <modal_endpoint_url>")
        print("\nExample:")
        print("  python process_saved_video.py video/video_file.array.npy https://...modals.run")
        print("\nTo get the endpoint URL:")
        print("1. Deploy the Modal app: modal deploy backend/sgl_vlm.py")
        print("2. Get the URL from Modal dashboard or use: modal app show example-sgl-vlm")
        print("3. Look for the 'analyze_video' endpoint URL")
        print("   It should be something like: https://<workspace>--example-sgl-vlm-model-analyze-video.modal.run")
        print("\nAlternatively, you can use the Modal Python API:")
        print("   from backend.sgl_vlm import app, Model")
        print("   model = Model()")
        print("   url = model.analyze_video.get_web_url()")
        sys.exit(1)
    
    video_file = sys.argv[1]
    modal_url = sys.argv[2]
    
    question = """You are an expert debate coach. Based on the user's video input, how would you evaluate their delivery in terms of the following:

- Posture: Are they standing confidently, or do they lean, slouch, or shift excessively?
- Hand Gestures: Are their gestures natural and supportive, or distracting, repetitive, or minimal?
- Eye Contact: Do they consistently engage with the audience/camera, or look away too often?
- Vocal Intensity: Does their tone convey confidence and clarity, or is it monotone, overly aggressive, or lacking projection?
- Facial Expression: Are their expressions appropriate, expressive, or inconsistent with their message?
- Overall Presence: Do they appear confident, persuasive, and engaged?

After assessing each category, what 2–3 concrete suggestions would you give to help them improve?"""
    
    load_and_analyze(video_file, modal_url, question=question)

