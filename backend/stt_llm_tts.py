from modal_parakeet import transcribe_audio
import os
import openai
from dotenv import load_dotenv
import modal

load_dotenv()

# NOTE: Allow for more general [debate form] instead of "public forum" for generalizability
client = openai.OpenAI(api_key=os.getenv("OPENROUTER_API_KEY"))

SYSTEM_PROMPT = """You are a debate team coach specializing in policy debate. 
Analyze the user's speech on its content, structure, argumentation, grammar, and style. 
Provide detailed feedback on each aspect, including specific examples from the speech. 
Offer constructive suggestions for improvement and highlight particularly strong aspects of the speech. 
Additionally, offer some possible rebuttals from the opposing team against the speech and brainstorm potential responses."""

def get_transcript(file_path: str = "audiotests/user_recording.wav"):
    return transcribe_audio(file_path)

def get_feedback(transcript: str):
    # Pass transcribed output to ChatGPT 5.1 for some feedback on speech content, structure, and style
    response = client.chat.completions.create(
        model="openai/gpt-5",
        messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": transcript}
        ]
    )
    return response.choices[0].message.content

get_feedback("Climate change is a serious problem and we need to act now. We need to reduce carbon emissions and transition to renewable energy sources.")