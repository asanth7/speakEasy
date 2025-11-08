# stt_stream.py
import asyncio, base64, json, sounddevice as sd, websockets

SR = 16_000
CHUNK_MS = 100
SAMPLES = SR * CHUNK_MS // 1000
MODAL_WS = "wss://<modal-forward-url>/ws"

async def stream():
    async with websockets.connect(MODAL_WS) as ws:
        await ws.send(json.dumps({"type": "start_client_session"}))

        stream = sd.InputStream(samplerate=SR, channels=1, dtype="int16")
        stream.start()

        async def reader():
            async for msg in ws:
                print("Transcript:", msg)

        async def writer():
            while True:
                frames, _ = stream.read(SAMPLES)
                payload = base64.b64encode(frames.tobytes()).decode()
                await ws.send(json.dumps({"type": "audio", "audio": payload}))

        await asyncio.gather(reader(), writer())

if __name__ == "__main__":
    asyncio.run(stream())