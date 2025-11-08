"""
Test script to verify Modal endpoints are working correctly.
"""
import json
import urllib.request
import sys

def test_generate_endpoint(url):
    """Test the generate endpoint with a simple image URL."""
    print(f"Testing generate endpoint: {url}")
    print("-" * 80)
    
    payload = json.dumps({
        "image_url": "https://modal-public-assets.s3.amazonaws.com/golden-gate-bridge.jpg",
        "question": """You are an expert debate coach in ENGLISH (output in ENGLISH). Based on the user’s video input, evaluate their delivery in terms of the following categories. For each frame, provide a rating of "high", "medium", or "low" for every category:

- Posture: Are they standing confidently, balanced, and upright? Or do they lean, slouch, sway, or shift excessively?
- Hand Gestures: Are gestures natural, supportive, and purposeful, or are they distracting, repetitive, rigid, or minimal?
- Eye Contact: Do they maintain consistent engagement with the audience/camera, or look away too often, down, or off-screen?
- Vocal Intensity: Is their vocal delivery confident, clear, well-projected, and dynamic, or monotone, overly aggressive, or lacking presence?
- Facial Expression: Are expressions expressive, emotional, and aligned with their message, or flat, tense, or inconsistent?
- Overall Presence: Do they appear persuasive, confident, focused, and engaged?

You must also evaluate the speaker specifically for:
- Intensity: Do they show strong energy, emotional impact, and conviction?
- Confidence: Do they appear comfortable, assertive, steady, and in control?
- Presence: Do they engage the audience and command attention through voice, posture, and expression?

All results must be output ONLY as a JSON object in the following structure:

{
  "Posture": "",
  "Hand Gestures": "",
  "Eye Contact": "",
  "Vocal Intensity": "",
  "Facial Expression": "",
  "Overall Presence": "",
  "Intensity": "",
  "Confidence": "",
  "Presence": "",
  "Suggestions": ""
}

Each field should contain the rating "high", "medium", or "low" for that frame.

After evaluating all frames, provide 2–3 specific and actionable suggestions that would help the speaker improve their delivery. Keep suggestions practical, short, and realistic."""


    })
    
    req = urllib.request.Request(
        url,
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            assert response.getcode() == 200, f"HTTP {response.getcode()}"
            result = response.read().decode()
            print("✓ SUCCESS!")
            print(f"Response: {result}")
            return json.loads(result)
    except urllib.error.HTTPError as e:
        print(f"✗ HTTP Error {e.code}: {e.reason}")
        error_body = e.read().decode()
        print(f"Error details: {error_body}")
        return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_analyze_video_endpoint(url):
    """Test the analyze_video endpoint with a single test frame."""
    print(f"\nTesting analyze_video endpoint: {url}")
    print("-" * 80)
    
    # Create a minimal test - we'd need a real base64 encoded image for this
    # For now, just test if the endpoint exists and accepts the right format
    print("Note: This endpoint requires base64-encoded video frames.")
    print("Use process_video_camera.py or process_saved_video.py for full testing.")
    
    # You can test with an empty frames array to see the error message
    payload = json.dumps({
        "frames": [],
        "question": """You are an expert debate coach in ENGLISH (output in ENGLISH). Based on the user’s video input, evaluate their delivery in terms of the following categories. For each frame, provide a rating of "high", "medium", or "low" for every category:

- Posture: Are they standing confidently, balanced, and upright? Or do they lean, slouch, sway, or shift excessively?
- Hand Gestures: Are gestures natural, supportive, and purposeful, or are they distracting, repetitive, rigid, or minimal?
- Eye Contact: Do they maintain consistent engagement with the audience/camera, or look away too often, down, or off-screen?
- Vocal Intensity: Is their vocal delivery confident, clear, well-projected, and dynamic, or monotone, overly aggressive, or lacking presence?
- Facial Expression: Are expressions expressive, emotional, and aligned with their message, or flat, tense, or inconsistent?
- Overall Presence: Do they appear persuasive, confident, focused, and engaged?

You must also evaluate the speaker specifically for:
- Intensity: Do they show strong energy, emotional impact, and conviction?
- Confidence: Do they appear comfortable, assertive, steady, and in control?
- Presence: Do they engage the audience and command attention through voice, posture, and expression?

All results must be output ONLY as a JSON object in the following structure:

{
  "Posture": "",
  "Hand Gestures": "",
  "Eye Contact": "",
  "Vocal Intensity": "",
  "Facial Expression": "",
  "Overall Presence": "",
  "Intensity": "",
  "Confidence": "",
  "Presence": "",
  "Suggestions": ""
}

Each field should contain the rating "high", "medium", or "low" for that frame.

After evaluating all frames, provide 2–3 specific and actionable suggestions that would help the speaker improve their delivery. Keep suggestions practical, short, and realistic."""
    })
    
    req = urllib.request.Request(
        url,
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            assert response.getcode() == 200, f"HTTP {response.getcode()}"
            result = response.read().decode()
            print("✓ Endpoint is accessible!")
            print(f"Response: {result}")
            return json.loads(result)
    except urllib.error.HTTPError as e:
        print(f"✗ HTTP Error {e.code}: {e.reason}")
        error_body = e.read().decode()
        print(f"Error details: {error_body}")
        # If we get an error about no frames, that's actually good - means endpoint works!
        if "No frames provided" in error_body or "frames" in error_body.lower():
            print("✓ Endpoint is working! It just needs frames.")
        return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_endpoint.py <endpoint_url> [endpoint_type]")
        print("\nExample:")
        print("  python test_endpoint.py https://...--example-sgl-vlm-model-generate.modal.run generate")
        print("  python test_endpoint.py https://...--example-sgl-vlm-model-analyze-video.modal.run analyze_video")
        print("\nIf endpoint_type is not provided, both will be tested.")
        sys.exit(1)
    
    url = sys.argv[1].rstrip('/')  # Remove trailing slash
    endpoint_type = sys.argv[2] if len(sys.argv) > 2 else "both"
    
    print("=" * 80)
    print("Modal Endpoint Tester")
    print("=" * 80)
    print()
    
    if endpoint_type in ["generate", "both"]:
        # Construct generate URL if analyze_video URL was provided
        if "analyze-video" in url:
            generate_url = url.replace("analyze-video", "generate")
        else:
            generate_url = url
        
        test_generate_endpoint(generate_url)
    
    if endpoint_type in ["analyze_video", "analyze-video", "both"]:
        # Construct analyze_video URL if generate URL was provided
        if "analyze-video" not in url and "generate" in url:
            analyze_url = url.replace("generate", "analyze-video")
        elif "analyze-video" in url:
            analyze_url = url
        else:
            # Try to construct it
            base_url = url.rsplit("/", 1)[0] if "/" in url else url
            analyze_url = f"{base_url}/analyze-video"
        
        test_analyze_video_endpoint(analyze_url)
    
    print("\n" + "=" * 80)
    print("Testing complete!")
    print("=" * 80)

