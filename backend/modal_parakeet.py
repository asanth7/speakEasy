from typing import Optional

import modal
from pathlib import Path
import tempfile
# import ffmpeg

MODEL_DIR = "/model"
MODEL_NAME = "openai/whisper-large-v3"
MODEL_REVISION = "afda370583db9c5359511ed5d989400a6199dfe1"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")                 
    .pip_install(
        "ffmpeg-python",
        "torch==2.5.1",
        "transformers==4.47.1",
        "hf-transfer==0.1.8",
        "huggingface_hub==0.27.0",
        "librosa==0.10.2",
        "soundfile==0.12.1",
        "accelerate==1.2.1",
        "datasets==3.2.0",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1", "HF_HUB_CACHE": MODEL_DIR})
)

model_cache = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)
app = modal.App(
    "example-batched-whisper",
    image=image,
)

@app.cls(gpu="a10g")
class Model:
    @modal.enter()
    def load_model(self):
        import torch, transformers
        from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
        self.processor = AutoProcessor.from_pretrained(MODEL_NAME)
        self.model = AutoModelForSpeechSeq2Seq.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
            use_safetensors=True,
        ).to("cuda")
        self.pipeline = pipeline(
            "automatic-speech-recognition",
            model=self.model,
            tokenizer=self.processor.tokenizer,
            feature_extractor=self.processor.feature_extractor,
            torch_dtype=torch.float16,
            device="cuda",
        )

    # @modal.method()
    # def transcribe_file(self, file_path: str):
    #     return self.pipeline(file_path)
    @modal.method()
    def transcribe_bytes(self, wav_bytes: bytes):
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            tmp.write(wav_bytes)
            tmp.flush()
            return self.pipeline(tmp.name)

@app.local_entrypoint()
def transcribe_audio(file_path: str = "audiotests/user_recording.wav"):
    wav_bytes = Path(file_path).read_bytes()
    result = Model().transcribe_bytes.remote(wav_bytes)
    return result["text"]

# RUN COMMAND: python -m modal run backend.modal_parakeet --file-path audiotests/user_recording.wav