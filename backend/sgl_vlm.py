import os
import time
import warnings
from pathlib import Path
from typing import Optional
from uuid import uuid4

import modal

GPU_TYPE = os.environ.get("GPU_TYPE", "l40s")
GPU_COUNT = os.environ.get("GPU_COUNT", 1)

GPU_CONFIG = f"{GPU_TYPE}:{GPU_COUNT}"

SGL_LOG_LEVEL = "error"  # try "debug" or "info" if you have issues

MINUTES = 60  # seconds


MODEL_PATH = "Qwen/Qwen2-VL-7B-Instruct"
MODEL_REVISION = "a7a06a1cc11b4514ce9edcde0e3ca1d16e5ff2fc"
TOKENIZER_PATH = "Qwen/Qwen2-VL-7B-Instruct"
MODEL_CHAT_TEMPLATE = "qwen2-vl"


MODEL_VOL_PATH = Path("/models")
MODEL_VOL = modal.Volume.from_name("sgl-cache", create_if_missing=True)
volumes = {MODEL_VOL_PATH: MODEL_VOL}


def download_model():
    from huggingface_hub import snapshot_download

    snapshot_download(
        MODEL_PATH,
        local_dir=str(MODEL_VOL_PATH / MODEL_PATH),
        revision=MODEL_REVISION,
        ignore_patterns=["*.pt", "*.bin"],
    )

cuda_version = "12.8.0"  # should be no greater than host CUDA version
flavor = "devel"  #  includes full CUDA toolkit
operating_sys = "ubuntu22.04"
tag = f"{cuda_version}-{flavor}-{operating_sys}"

vlm_image = (
    modal.Image.from_registry(f"nvidia/cuda:{tag}", add_python="3.11")
    .entrypoint([])  # removes chatty prints on entry
    .apt_install("libnuma-dev")  # Add NUMA library for sgl_kernel
    .pip_install(  # add sglang and some Python dependencies
        "transformers==4.54.1",
        "numpy<2",
        "fastapi[standard]==0.115.4",
        "pydantic==2.9.2",
        "requests==2.32.3",
        "starlette==0.41.2",
        "torch==2.7.1",
        "sglang[all]==0.4.10.post2",
        "sgl-kernel==0.2.8",
        "hf-xet==1.1.5",
    )
    .env(
        {
            "HF_HOME": str(MODEL_VOL_PATH),
            "HF_HUB_ENABLE_HF_TRANSFER": "1",
        }
    )
    .run_function(  # download the model by running a Python function
        download_model, volumes=volumes
    )
    .pip_install(  # add an optional extra that renders images in the terminal
        "term-image==0.7.1",
        "pillow==10.4.0",  # For image processing
    )
)

app = modal.App("example-sgl-vlm")


@app.cls(
    gpu=GPU_CONFIG,
    timeout=20 * MINUTES,
    scaledown_window=20 * MINUTES,
    image=vlm_image,
    volumes=volumes,
)
@modal.concurrent(max_inputs=100)
class Model:
    @modal.enter()  # what should a container do after it starts but before it gets input?
    def start_runtime(self):
        """Starts an SGL runtime to execute inference."""
        import sglang as sgl

        self.runtime = sgl.Runtime(
            model_path=MODEL_PATH,
            tokenizer_path=TOKENIZER_PATH,
            tp_size=GPU_COUNT,  # t_ensor p_arallel size, number of GPUs to split the model over
            log_level=SGL_LOG_LEVEL,
        )
        self.runtime.endpoint.chat_template = sgl.lang.chat_template.get_chat_template(
            MODEL_CHAT_TEMPLATE
        )
        sgl.set_default_backend(self.runtime)

    @modal.fastapi_endpoint(method="POST", docs=True)
    def generate(self, request: dict) -> str:
        """Generate a response to an image question.
        
        Accepts POST requests with JSON body:
        {
            "image_url": "https://example.com/image.jpg",  # Optional
            "image_data": "base64_encoded_image",  # Optional (alternative to image_url)
            "question": "What is this?"  # Optional, defaults to "What is this?"
        }
        """
        from pathlib import Path
        import base64
        import io

        import requests
        import sglang as sgl
        from PIL import Image
        from term_image.image import from_file

        start = time.monotonic_ns()
        request_id = uuid4()
        print(f"Generating response to request {request_id}")

        # Check if image_data (base64) is provided, otherwise fall back to image_url
        image_data = request.get("image_data")
        image_url = request.get("image_url")
        
        if image_data:
            # Decode base64 image data
            try:
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
                image_path = Path(f"/tmp/{uuid4()}-frame.jpg")
                image.save(image_path, format="JPEG")
            except Exception as e:
                return f"Error decoding image: {str(e)}"
        elif image_url:
            response = requests.get(image_url)
            response.raise_for_status()
            image_filename = image_url.split("/")[-1]
            image_path = Path(f"/tmp/{uuid4()}-{image_filename}")
            image_path.write_bytes(response.content)
        else:
            # Default fallback
            image_url = (
                "https://modal-public-assets.s3.amazonaws.com/golden-gate-bridge.jpg"
            )
            response = requests.get(image_url)
            response.raise_for_status()
            image_filename = image_url.split("/")[-1]
            image_path = Path(f"/tmp/{uuid4()}-{image_filename}")
            image_path.write_bytes(response.content)

        @sgl.function
        def image_qa(s, image_path, question):
            s += sgl.user(sgl.image(str(image_path)) + question)
            s += sgl.assistant(sgl.gen("answer"))

        question = request.get("question")
        if question is None:
            question = "What is this?"

        state = image_qa.run(
            image_path=image_path, question=question, max_new_tokens=512
        )
        # show the question and image in the terminal for demonstration purposes
        print(Colors.BOLD, Colors.GRAY, "Question: ", question, Colors.END, sep="")
        try:
            terminal_image = from_file(image_path)
            terminal_image.draw()
        except Exception:
            pass  # Skip terminal image display if not in terminal
        print(
            f"request {request_id} completed in {round((time.monotonic_ns() - start) / 1e9, 2)} seconds"
        )

        return state["answer"]

    @modal.fastapi_endpoint(method="POST", docs=True)
    def analyze_video(self, request: dict) -> dict:
        """Analyze video frames for speaker expressiveness and posture."""
        from pathlib import Path
        import base64
        import io

        import sglang as sgl
        from PIL import Image

        start = time.monotonic_ns()
        request_id = uuid4()
        print(f"Analyzing video frames for request {request_id}")

        frames_data = request.get("frames", [])
        if not frames_data:
            return {"error": "No frames provided"}

        question = request.get(
            "question",
            """You are an expert debate coach. You will see multiple frames from a video recording. Based on ALL the frames you observe, provide ONE comprehensive overall evaluation of their delivery in terms of the following:

- Posture: Are they standing confidently, or do they lean, slouch, or shift excessively?
- Hand Gestures: Are their gestures natural and supportive, or distracting, repetitive, or minimal?
- Eye Contact: Do they consistently engage with the audience/camera, or look away too often?
- Vocal Intensity: Does their tone convey confidence and clarity, or is it monotone, overly aggressive, or lacking projection?
- Facial Expression: Are their expressions appropriate, expressive, or inconsistent with their message?
- Overall Presence: Do they appear confident, persuasive, and engaged?

Provide a SINGLE comprehensive assessment that considers patterns across the entire video, not individual frame observations. After assessing each category, what 2–3 concrete suggestions would you give to help them improve?""",
        )

        results = []
        
        # Smart sampling: frames are already pre-sampled (every 30 frames = 1 per second)
        # For 15-second video, expect ~15 frames (already sampled at source)
        total_frames = len(frames_data)
        
        # Since frames are pre-sampled, process all of them (they're already limited)
        # But cap at reasonable limits to avoid excessive token usage
        if total_frames <= 10:
            max_frames_to_process = total_frames
            sample_rate = 1
        elif total_frames <= 20:
            max_frames_to_process = total_frames  # Process all pre-sampled frames
            sample_rate = 1
        else:
            max_frames_to_process = 20  # Cap at 20 frames even if more are sent
            sample_rate = max(1, total_frames // max_frames_to_process)
        
        # Sample frames
        frames_to_process = frames_data[::sample_rate][:max_frames_to_process]
        
        # Create list of original indices for the sampled frames
        frame_indices = list(range(0, total_frames, sample_rate))[:len(frames_to_process)]
        
        print(f"Processing {len(frames_to_process)} frames from {total_frames} total (sample_rate={sample_rate})")

        @sgl.function
        def image_qa(s, image_path, question):
            s += sgl.user(sgl.image(str(image_path)) + question)
            s += sgl.assistant(sgl.gen("answer"))

        # Process frames individually to collect observations, then synthesize into one overall analysis
        frame_paths = []
        individual_observations = []
        
        # First, process each frame to get observations (with a prompt focused on observation, not full analysis)
        observation_question = """Observe this frame from a video. Note key details about:
- Posture and body positioning
- Hand gestures and arm movements  
- Eye contact direction
- Facial expressions
- Overall presence and confidence

Provide brief observations (2-3 sentences max) that can be combined with other frames."""
        
        for i, (frame_data, original_idx) in enumerate(zip(frames_to_process, frame_indices)):
            try:
                # Decode base64 image
                image_bytes = base64.b64decode(frame_data)
                image = Image.open(io.BytesIO(image_bytes))
                image_path = Path(f"/tmp/{uuid4()}-frame-{i}.jpg")
                image.save(image_path, format="JPEG")
                frame_paths.append(image_path)
                
                # Get brief observation from this frame
                print(f"Observing frame {i+1}/{len(frames_to_process)} (original index {original_idx})...")
                state = image_qa.run(
                    image_path=image_path, question=observation_question, max_new_tokens=200
                )
                individual_observations.append(state["answer"])
                
            except Exception as e:
                print(f"Error processing frame {i+1}: {str(e)}")
                individual_observations.append(f"Frame {i+1}: Unable to process")
        
        # Now synthesize all observations into ONE overall assessment
        if individual_observations:
            print(f"\nSynthesizing observations from {len(individual_observations)} frames into overall assessment...")
            
            # Create synthesis prompt that combines all observations
            synthesis_question = f"""You are an expert debate coach. Based on observations from multiple frames across a video recording, provide ONE comprehensive overall evaluation:

Frame Observations:
{chr(10).join([f"Frame {i+1}: {obs}" for i, obs in enumerate(individual_observations)])}

Based on ALL these observations, provide ONE unified overall evaluation covering:
- Posture: Are they standing confidently, or do they lean, slouch, or shift excessively?
- Hand Gestures: Are their gestures natural and supportive, or distracting, repetitive, or minimal?
- Eye Contact: Do they consistently engage with the audience/camera, or look away too often?
- Facial Expression: Are their expressions appropriate, expressive, or inconsistent with their message?
- Overall Presence: Do they appear confident, persuasive, and engaged?

Provide a SINGLE comprehensive assessment (not frame-by-frame). After assessing each category, what 2–3 concrete suggestions would you give to help them improve?"""
            
            # Use one of the frames (preferably middle frame) for the synthesis
            synthesis_frame_idx = len(frame_paths) // 2
            synthesis_image_path = frame_paths[synthesis_frame_idx]
            
            try:
                @sgl.function
                def synthesize_analysis(s, image_path, question):
                    s += sgl.user(sgl.image(str(image_path)) + "\n\n" + question)
                    s += sgl.assistant(sgl.gen("answer"))
                
                state = synthesize_analysis.run(
                    image_path=synthesis_image_path, question=synthesis_question, max_new_tokens=1024
                )
                
                overall_analysis = state["answer"]
                analysis_text = overall_analysis
                results.append({
                    "overall_analysis": overall_analysis,
                    "frames_observed": len(individual_observations)
                })
                
            except Exception as e:
                print(f"Error in synthesis: {str(e)}")
                # Fallback: combine observations manually
                analysis_text = f"""Overall Assessment Based on {len(individual_observations)} Video Frames:

{chr(10).join([f"• {obs}" for obs in individual_observations[:5]])}

[Note: Individual frame observations combined. For detailed analysis, please ensure proper frame processing.]"""
                results.append({
                    "overall_analysis": analysis_text,
                    "frames_observed": len(individual_observations),
                    "error": "Synthesis failed, showing combined observations"
                })
        else:
            analysis_text = "Error: Could not process any frames."
            results.append({
                "error": "Could not process any frames"
            })
        
        print(
            f"Video analysis request {request_id} completed in {round((time.monotonic_ns() - start) / 1e9, 2)} seconds"
        )

        return {
            "request_id": str(request_id),
            "frames_processed": len(frames_to_process),
            "total_frames": total_frames,
            "sample_rate": sample_rate,
            "results": results,
            "combined_analysis": analysis_text
        }

    @modal.exit()  # what should a container do before it shuts down?
    def shutdown_runtime(self):
        self.runtime.shutdown()

@app.local_entrypoint()
def main(
    image_url: Optional[str] = None, question: Optional[str] = None, twice: bool = True
):
    import json
    import urllib.request

    model = Model()

    payload = json.dumps(
        {
            "image_url": image_url,
            "question": question,
        },
    )

    req = urllib.request.Request(
        model.generate.get_web_url(),
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(req) as response:
        assert response.getcode() == 200, response.getcode()
        print(json.loads(response.read().decode()))

    if twice:
        # second response is faster, because the Function is already running
        with urllib.request.urlopen(req) as response:
            assert response.getcode() == 200, response.getcode()
            print(json.loads(response.read().decode()))

warnings.filterwarnings(  # filter warning from the terminal image library
    "ignore",
    message="It seems this process is not running within a terminal. Hence, some features will behave differently or be disabled.",
    category=UserWarning,
)


class Colors:
    """ANSI color codes"""

    GREEN = "\033[0;32m"
    BLUE = "\033[0;34m"
    GRAY = "\033[0;90m"
    BOLD = "\033[1m"
    END = "\033[0m"

if __name__ == "__main__":
    main()