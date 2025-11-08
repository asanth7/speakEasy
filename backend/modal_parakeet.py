import asyncio, base64, json
import sounddevice as sd
import websockets
import pyaudio, soundfile as sf
import modal, torch
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File
from starlette.websockets import WebSocketState
from starlette.websockets import WebSocketDisconnect
from starlette.websockets import WebSocketState
from starlette.websockets import WebSocketState
import numpy as np

app = modal.App("parakeet-ws")
cache = modal.Volume.from_name("parakeet-cache", create_if_missing=True)
image = (
    modal.Image.from_registry("nvidia/cuda:12.4.0-cudnn-devel-ubuntu22.04", add_python="3.11")
    .env({"HF_HOME": "/cache", "TORCH_HOME": "/cache"})
    .apt_install("ffmpeg")
    .pip_install("nemo_toolkit[asr]==2.3.0", "torch==2.2.2", "fastapi", "soundfile", "numpy<2")
)

SR = 16_000

@app.cls(volumes={"/cache": cache}, gpu="A100", image=image, concurrency_limit=5)
class Transcriber:
    def __init__(self):
        self.api = FastAPI()

        @self.api.websocket("/ws")
        async def ws_route(ws: WebSocket):
            await ws.accept()
            queue = asyncio.Queue()
            listener = asyncio.create_task(self._recv(ws, queue))
            worker = asyncio.create_task(self._run(queue, ws))
            await asyncio.gather(listener, worker)

    @modal.enter()
    def load(self):
        import nemo.collections.asr as nemo_asr
        self.model = nemo_asr.models.ASRModel.from_pretrained("nvidia/parakeet-tdt-0.6b-v3")
        self.model.to("cuda").eval()

    async def _recv(self, ws, queue):
        try:
            while True:
                msg = await ws.receive_text()
                data = json.loads(msg)
                if data.get("type") == "audio":
                    queue.put_nowait(base64.b64decode(data["audio"]))
        except WebSocketDisconnect:
            queue.put_nowait(None)

    async def _run(self, queue, ws):
        buffers = bytearray()
        while True:
            chunk = await queue.get()
            if chunk is None:
                break
            buffers.extend(chunk)
            if len(buffers) >= SR * 2 * 0.5:  # 0.5 s buffer
                tensor = torch.from_numpy(
                    np.frombuffer(buffers, dtype=np.int16).astype(np.float32) / 32768.0
                )
                buffers.clear()
                with torch.inference_mode():
                    text = self.model.transcribe([tensor])[0]
                await ws.send_text(text)

    @modal.asgi_app()
    def app(self):
        return self.api