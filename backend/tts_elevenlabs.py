import elevenlabs
from elevenlabs import ElevenLabs, stream
from elevenlabs.client import ElevenLabs
import os
from dotenv import load_dotenv
load_dotenv()

elevenlabs = ElevenLabs(
    base_url="https://api.elevenlabs.io",
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

# key = client.service_accounts.api_keys.create(
#     service_account_user_id="service_account_user_id",
#     name="string",
#     permissions=[
#         "text_to_speech"
#     ]
# )

audio_stream = elevenlabs.text_to_speech.stream(
    text="This is a test",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_multilingual_v2"
)
# option 1: play the streamed audio locally
stream(audio_stream)
