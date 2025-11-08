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
        "term-image==0.7.1"
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
        from pathlib import Path

        import requests
        import sglang as sgl
        from term_image.image import from_file

        start = time.monotonic_ns()
        request_id = uuid4()
        print(f"Generating response to request {request_id}")

        image_url = request.get("image_url")
        if image_url is None:
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
            image_path=image_path, question=question, max_new_tokens=128
        )
        # show the question and image in the terminal for demonstration purposes
        print(Colors.BOLD, Colors.GRAY, "Question: ", question, Colors.END, sep="")
        terminal_image = from_file(image_path)
        terminal_image.draw()
        print(
            f"request {request_id} completed in {round((time.monotonic_ns() - start) / 1e9, 2)} seconds"
        )

        return state["answer"]

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


if __name__ == "__main__":
    main()