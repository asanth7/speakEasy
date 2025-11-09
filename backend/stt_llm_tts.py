from modal_parakeet import transcribe_audio
import os
import openai
from dotenv import load_dotenv

load_dotenv()

# NOTE: Allow for more general [debate form] instead of "public forum" for generalizability
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables. Please set it in your .env file.")

# Strip whitespace and quotes from API key (handles cases where .env has quotes around the value)
api_key = api_key.strip().strip('"').strip("'")

if not api_key or len(api_key) < 10:
    raise ValueError("OPENROUTER_API_KEY appears to be invalid (too short or empty). Please check your .env file.")

client = openai.OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=api_key,
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
    
    # Verify API key is set
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not found in environment variables. Please set it in your .env file.")
    
    try:
        response = client.chat.completions.create(
            model="openai/gpt-5",
            messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": transcript}
            ]
        )
        return response.choices[0].message.content
    except openai.AuthenticationError as e:
        error_msg = str(e)
        print(f"Authentication error: {error_msg}")
        if "User not found" in error_msg:
            raise ValueError("Invalid OPENROUTER_API_KEY. The API key may be expired or incorrect. Please check your .env file and verify the key at https://openrouter.ai/keys")
        else:
            raise ValueError(f"Authentication failed: {error_msg}. Please check your OPENROUTER_API_KEY in the .env file.")
    except openai.APIError as e:
        print(f"API error: {e}")
        raise
    except Exception as e:
        print(f"Error getting feedback from GPT: {e}")
        raise

# Test function - only runs if script is executed directly
if __name__ == "__main__":
    test_transcript = "Climate change is a serious issue that needs to be addressed. We need to take action now, by encouraging our politicians to pursue policies that reduce greenhouse gas emissions and promote sustainable practices."
    
    # Check API key format
    print(f"API Key loaded: {'Yes' if api_key else 'No'}")
    if api_key:
        print(f"API Key length: {len(api_key)}")
        print(f"API Key starts with: {api_key[:10]}...")
        if not api_key.startswith('sk-or-v1-') and not api_key.startswith('sk-'):
            print("WARNING: API key doesn't start with expected prefix (sk-or-v1- or sk-)")
    
    try:
        feedback = get_feedback_from_transcript(test_transcript)
        print("\n" + "="*60)
        print("Feedback received:")
        print("="*60)
        print(feedback)
    except ValueError as e:
        print(f"\n❌ Configuration Error: {e}")
        print("\nTo fix this:")
        print("1. Check your .env file in the project root")
        print("2. Make sure it contains: OPENROUTER_API_KEY=sk-or-v1-...")
        print("3. No quotes around the key value")
        print("4. Verify your key at: https://openrouter.ai/keys")
        print("5. Generate a new key if needed")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nThis might be a temporary API issue. Try again later.")

def get_feedback(audio_file):
    """Get transcript and feedback from audio file. Returns [transcript, feedback]."""
    transcript = get_transcript(audio_file)
    gpt5_feedback = get_feedback_from_transcript(transcript)
    return [transcript, gpt5_feedback]