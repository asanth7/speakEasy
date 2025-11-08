import asyncio, base64, json
import sounddevice as sd
import websockets
import pyaudio
import modal, torch
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File

SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
