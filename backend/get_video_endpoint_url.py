"""
Helper script to get the Modal endpoint URL for video analysis.

The easiest way to get the endpoint URL is from the deployment output when you run:
  modal deploy backend/sgl_vlm.py

Modal will print all endpoint URLs after deployment. Look for the one containing 'analyze-video'.

Alternatively, check the Modal dashboard at https://modal.com/apps
"""
import sys
import subprocess
import re

def check_deployment_output():
    """Try to find URL in recent Modal deployment output."""
    print("Checking if you can see the URL in deployment output...")
    print("When you deployed with 'modal deploy backend/sgl_vlm.py',")
    print("Modal should have printed endpoint URLs. Look for one containing 'analyze-video'")
    return None

def get_workspace_name():
    """Try to get workspace name from Modal config."""
    try:
        # Try to get workspace from modal token or config
        result = subprocess.run(
            ["modal", "token", "whoami"],
            capture_output=True,
            text=True,
            check=True
        )
        # Parse output to see if we can extract workspace
        return None  # Will implement if needed
    except:
        return None

if __name__ == "__main__":
    print("=" * 80)
    print("Modal Video Analysis Endpoint URL Helper")
    print("=" * 80)
    print()
    
    print("To get your endpoint URL, use one of these methods:\n")
    
    print("METHOD 1: Check Deployment Output (Easiest)")
    print("-" * 80)
    print("When you ran 'modal deploy backend/sgl_vlm.py', Modal printed endpoint URLs.")
    print("Look through the output for a URL containing 'analyze-video'.")
    print("It should look like:")
    print("  https://<workspace>--example-sgl-vlm-model-analyze-video.modal.run")
    print()
    
    print("METHOD 2: Modal Dashboard")
    print("-" * 80)
    print("1. Go to: https://modal.com/apps")
    print("2. Find and click on the 'example-sgl-vlm' app")
    print("3. Look for the 'analyze_video' endpoint in the list")
    print("4. Copy the endpoint URL")
    print()
    
    print("METHOD 3: Deploy Again")
    print("-" * 80)
    print("If you can't find the URL, redeploy and watch for the output:")
    print("  cd backend")
    print("  modal deploy sgl_vlm.py")
    print("  # Look for URLs in the output")
    print()
    
    print("METHOD 4: URL Pattern")
    print("-" * 80)
    print("Modal URLs follow this pattern:")
    print("  https://<workspace>--example-sgl-vlm-model-analyze-video.modal.run")
    print()
    print("To find your workspace name:")
    print("  1. Check the Modal dashboard URL when you're logged in")
    print("  2. Or check the deployment output (workspace is in the URL)")
    print()
    
    print("=" * 80)
    print()
    print("Once you have the URL, use it with:")
    print("  python backend/process_video_camera.py <endpoint_url>")
    print("  python backend/process_saved_video.py <video_file.npy> <endpoint_url>")
    print()
    print("=" * 80)

