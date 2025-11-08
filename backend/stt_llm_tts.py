from modal_parakeet import transcribe_audio
import os
import openai
from dotenv import load_dotenv
import modal

load_dotenv()

# NOTE: Allow for more general [debate form] instead of "public forum" for generalizability
client = openai.OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("OPENROUTER_API_KEY"),
)
SYSTEM_PROMPT = """You are a debate team coach specializing in policy debate. 
Analyze the user's speech on its content, structure, argumentation, grammar, and style. 
Provide detailed feedback on each aspect, including specific examples from the speech. 
Offer constructive suggestions for improvement and highlight particularly strong aspects of the speech. 
Additionally, offer some possible rebuttals from the opposing team against the speech and brainstorm potential responses.
Suggest and list possible (verified, academic, potentially peer-reviewed) sources and arguments that the user could explore to further strengthen their speech.
DO NOT be verbose in your response. Keep it concise and to the point, while providing specific, helpful feedback.
Be HONEST, balancing constructive criticism with kind support.
Return your response as a text string with all this information."""

def get_transcript(file_path: str = "audiotests/user_recording.wav"):
    return transcribe_audio(file_path)

def get_feedback_from_transcript(transcript: str):
    # Pass transcribed output to ChatGPT 5.1 for some feedback on speech content, structure, and style
    print("Calling ChatGPT 5 for feedback...")
    response = client.chat.completions.create(
        model="openai/gpt-5",
        messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": transcript}
        ]
    )
    return response.choices[0].message.content

print(get_feedback("Hello, how are you?"))

def get_feedback(audio_file):
    """Get transcript and feedback from audio file. Returns [transcript, feedback]."""
    transcript = get_transcript(audio_file)
    gpt5_feedback = get_feedback_from_transcript(transcript)
    return [transcript, gpt5_feedback]