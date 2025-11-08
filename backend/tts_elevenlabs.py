import elevenlabs
from elevenlabs import ElevenLabs, stream
from elevenlabs.client import ElevenLabs
# from elevenlabs.text_to_speech import text_to_speech

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

debate_text = """
You are a highly skilled debater. Speak clearly, confidently, and persuasively.
Structure your arguments logically, provide evidence when appropriate, and respond calmly to counterpoints.
Use rhetorical questions and emphasize key points. Pause slightly after each major point.
"""

audio_stream = elevenlabs.text_to_speech.stream(
    text=debate_text,
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_multilingual_v2"
)
# # option 1: play the streamed audio locally
# stream(audio_stream)

# audio = elevenlabs.text_to_speech.convert(
#     text=debate_text,
#     voice_id="JBFqnCBsd6RMkjVDRZzb",
#     model_id="eleven_multilingual_v2",
#     output_format="mp3_44100_128",
# )

stream(audio_stream)