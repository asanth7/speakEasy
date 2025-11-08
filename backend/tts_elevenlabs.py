from elevenlabs import ElevenLabs, stream
import os
from dotenv import load_dotenv

load_dotenv()

client = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

# key = client.service_accounts.api_keys.create(
#     service_account_user_id="service_account_user_id",
#     name="string",
#     permissions=[
#         "text_to_speech"
#     ]
# )

audio_stream = client.text_to_speech.stream(
    text="This is a test",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_multilingual_v2"
)
# option 1: play the streamed audio locally
stream(audio_stream)
