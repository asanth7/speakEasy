"""
Test script to properly test Modal endpoints with POST requests.
"""
import json
import urllib.request
import sys

def test_generate_endpoint(url):
    """Test the generate endpoint with a POST request."""
    print("=" * 80)
    print("Testing GENERATE endpoint")
    print("=" * 80)
    print(f"URL: {url}")
    print()
    
    # Remove trailing slash if present
    url = url.rstrip('/')
    
    payload = json.dumps({
        "image_url": "https://modal-public-assets.s3.amazonaws.com/golden-gate-bridge.jpg",
        "question": "What is this image showing?"
    })
    
    print("Sending POST request with payload:")
    print(json.dumps(json.loads(payload), indent=2))
    print()
    
    req = urllib.request.Request(
        url,
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    
    try:
        print("Waiting for response...")
        with urllib.request.urlopen(req, timeout=120) as response:
            status_code = response.getcode()
            print(f"✓ Status Code: {status_code}")
            
            result = response.read().decode()
            print(f"\nResponse:")
            print("-" * 80)
            print(result)
            print("-" * 80)
            
            # Try to parse as JSON
            try:
                parsed = json.loads(result)
                print("\nParsed JSON:")
                print(json.dumps(parsed, indent=2))
            except:
                print("\n(Response is not JSON, showing raw text above)")
            
            return result
    except urllib.error.HTTPError as e:
        print(f"✗ HTTP Error {e.code}: {e.reason}")
        error_body = e.read().decode()
        print(f"Error details:")
        print(error_body)
        return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_analyze_video_endpoint(url):
    """Test the analyze_video endpoint with a POST request."""
    print("\n" + "=" * 80)
    print("Testing ANALYZE_VIDEO endpoint")
    print("=" * 80)
    print(f"URL: {url}")
    print()
    
    # Remove trailing slash if present
    url = url.rstrip('/')
    
    # For testing, we'll send an empty frames array to see if the endpoint responds
    # (it should return an error saying no frames provided, which confirms it's working)
    payload = json.dumps({
        "frames": [],
        "question": "What do you think of the expressiveness and posture of this speaker?"
    })
    
    print("Sending POST request with payload:")
    print(json.dumps(json.loads(payload), indent=2))
    print()
    print("Note: This is a test with empty frames. For real usage, use process_video_camera.py")
    print()
    
    req = urllib.request.Request(
        url,
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    
    try:
        print("Waiting for response...")
        with urllib.request.urlopen(req, timeout=120) as response:
            status_code = response.getcode()
            print(f"✓ Status Code: {status_code}")
            
            result = response.read().decode()
            print(f"\nResponse:")
            print("-" * 80)
            print(result)
            print("-" * 80)
            
            # Try to parse as JSON
            try:
                parsed = json.loads(result)
                print("\nParsed JSON:")
                print(json.dumps(parsed, indent=2))
            except:
                print("\n(Response is not JSON, showing raw text above)")
            
            return result
    except urllib.error.HTTPError as e:
        print(f"✗ HTTP Error {e.code}: {e.reason}")
        error_body = e.read().decode()
        print(f"Error details:")
        print(error_body)
        # If we get "No frames provided", that's actually good - endpoint is working!
        if "No frames provided" in error_body or "frames" in error_body.lower():
            print("\n✓ Endpoint is working! It correctly rejected empty frames.")
        return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("=" * 80)
    print("Modal Endpoint Tester")
    print("=" * 80)
    print()
    print("NOTE: These endpoints require POST requests, not GET!")
    print("Accessing them in a browser (GET) will return 'Method Not Allowed' (405)")
    print()
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python test_modal_endpoints.py <generate_url> [analyze_video_url]")
        print()
        print("Example:")
        print("  python test_modal_endpoints.py https://derkekk111--example-sgl-vlm-model-generate.modal.run")
        print()
        print("Or test both:")
        generate_url = "https://derkekk111--example-sgl-vlm-model-generate.modal.run"
        analyze_url = generate_url.replace("generate", "analyze-video")
        print(f"  python test_modal_endpoints.py {generate_url} {analyze_url}")
        sys.exit(1)
    
    generate_url = sys.argv[1]
    analyze_url = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Test generate endpoint
    test_generate_endpoint(generate_url)
    
    # Test analyze_video endpoint if URL provided
    if analyze_url:
        test_analyze_video_endpoint(analyze_url)
    else:
        # Try to construct it from generate URL
        if "generate" in generate_url:
            analyze_url = generate_url.replace("generate", "analyze-video")
            print(f"\nAttempting to test analyze_video endpoint at: {analyze_url}")
            test_analyze_video_endpoint(analyze_url)
    
    print("\n" + "=" * 80)
    print("Testing complete!")
    print("=" * 80)
    print()
    print("For video analysis with real camera frames, use:")
    print("  python backend/process_video_camera.py <analyze_video_url>")
    print()

