import os
import numpy as np
import librosa
from faster_whisper import WhisperModel
from flask import Flask, request, jsonify
from flask_cors import CORS
from pydub import AudioSegment
import traceback
import json
from dotenv import load_dotenv
import torch
from transformers import pipeline
import cloudinary
import cloudinary.uploader

# --- SETUP ---
load_dotenv()
app = Flask(__name__)
CORS(app)

# --- CLOUDINARY CONFIGURATION ---
try:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    print("Cloudinary configured successfully.")
except Exception as e:
    print(f"CRITICAL ERROR: Could not configure Cloudinary. {e}")

# --- LOCAL AI MODEL LOADING ---
use_gpu = torch.cuda.is_available()
device_type = "cuda" if use_gpu else "cpu"
# On free CPU servers, we must use a lighter compute type
compute_type = "float16" if use_gpu else "int8"

# 1. WHISPER MODEL (SPEECH-TO-TEXT)
# --- FINAL FIX: USE THE 'small' MODEL TO FIT IN RENDER'S FREE TIER MEMORY ---
print(f"Loading Whisper 'small' model on {device_type.upper()}...")
try:
    whisper_model = WhisperModel("small", device=device_type, compute_type=compute_type)
    print(f"Whisper 'small' model loaded successfully on {device_type.upper()}.")
except Exception as e:
    print(f"CRITICAL ERROR: Could not load Whisper model. {e}")
    whisper_model = None

# 2. SENTIMENT ANALYSIS MODEL (FOR CONFIDENCE SCORE)
print("Loading local sentiment analysis model...")
try:
    sentiment_pipeline = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        device=0 if use_gpu else -1
    )
    print("Sentiment analysis model loaded successfully.")
except Exception as e:
    print(f"CRITICAL ERROR: Could not load sentiment analysis model. {e}")
    sentiment_pipeline = None


# --- HELPER FUNCTIONS ---
def analyze_pitch(filepath):
    """Analyzes the pitch of an audio file."""
    try:
        y, sr = librosa.load(filepath, sr=16000)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = [pitches[magnitudes[:, t].argmax(), t] for t in range(pitches.shape[1]) if
                        pitches[magnitudes[:, t].argmax(), t] > 0]
        if len(pitch_values) > 1: return float(np.std(pitch_values))
        return 0.0
    except Exception as e:
        print(f"Could not analyze pitch: {e}")
        return 0.0


def get_feedback(transcript, wpm, pitch_modulation, word_count, duration_seconds):
    """Uses local sentiment AI and rules for feedback."""
    confidence_score = 50
    if sentiment_pipeline:
        try:
            result = sentiment_pipeline(transcript)
            if result[0]['label'] == 'POSITIVE':
                confidence_score = int(result[0]['score'] * 100)
            else:
                confidence_score = int((1 - result[0]['score']) * 50)
        except Exception as e:
            print(f"Could not get local AI sentiment analysis: {e}")

    feedback = "Your practice session has been analyzed."
    improvements, mistakes = [], []

    if wpm > 170:
        mistakes.append(f"Your pace was quite fast at {wpm} WPM.")
        improvements.append("Try pausing briefly between key points.")
    elif wpm < 120 and word_count > 10:
        mistakes.append(f"Your pace was a bit slow at {wpm} WPM.")
        improvements.append("Try speaking with more energy.")
    else:
        feedback += " Your speaking pace was excellent."

    if pitch_modulation < 25 and duration_seconds > 4:
        mistakes.append("Your vocal delivery was a bit monotone.")
        improvements.append("Practice varying your pitch for emphasis.")
    else:
        feedback += " You used great vocal variety."

    filler_words = ['uh', 'um', 'like', 'you know', 'so', 'actually', 'basically']
    transcript_lower = transcript.lower()
    found_fillers = [word for word in filler_words if f" {word} " in transcript_lower]
    if found_fillers:
        mistakes.append(f"Some filler words like '{', '.join(found_fillers)}' were detected.")
        improvements.append("Try to pause silently instead of using filler words.")

    if not mistakes: mistakes.append("No major mistakes detected. Great job!")
    if not improvements: improvements.append("Keep practicing to build consistency.")

    return {
        "confidenceScore": confidence_score, "feedback": feedback,
        "improvements": improvements, "mistakes": mistakes
    }


# --- MAIN API ROUTE ---
@app.route('/analyze', methods=['POST'])
def analyze_speech():
    if 'audio' not in request.files or not whisper_model:
        return jsonify({'error': 'No audio file or required models are missing'}), 400

    audio_file = request.files['audio']
    uploads_dir = 'uploads'
    if not os.path.exists(uploads_dir): os.makedirs(uploads_dir)
    filepath = os.path.join(uploads_dir, "temp_recording.wav")
    audio_file.save(filepath)

    audio_url = None

    try:
        print("Cleaning and standardizing audio...")
        sound = AudioSegment.from_file(filepath)
        sound = sound.set_channels(1)
        sound = sound.set_frame_rate(16000)
        sound.export(filepath, format="wav")
        print("Audio cleaning complete.")

        print("Uploading audio to Cloudinary...")
        upload_result = cloudinary.uploader.upload(filepath, resource_type="video",
                                                   public_id=f"smart-speak/{os.path.basename(filepath).split('.')[0]}")
        audio_url = upload_result.get('secure_url')
        print(f"Audio successfully uploaded to: {audio_url}")

        print("Starting transcription...")
        segments, info = whisper_model.transcribe(filepath, beam_size=5, language="en")
        transcript = "".join(segment.text for segment in segments).strip()
        print(f"Transcription complete. Transcript: '{transcript}'")

        word_count = len(transcript.split())
        duration_seconds = len(sound) / 1000.0

        if not transcript or word_count < 1:
            return jsonify({
                'transcript': transcript or "No speech detected.", 'wpm': 0, 'pitchModulation': 0.0,
                'duration': duration_seconds,
                'audioURL': audio_url, 'confidenceScore': 0, 'feedback': 'Recording was too short or silent.',
                'improvements': ['Try speaking clearly for at least 3 seconds.'],
                'mistakes': ['No significant speech was detected.']
            })

        print("Calculating metrics...")
        wpm = (word_count / duration_seconds) * 60 if duration_seconds > 0 else 0
        pitch_modulation = analyze_pitch(filepath)
        print("Metrics calculated.")

        print("Getting local AI and rule-based feedback...")
        analysis = get_feedback(transcript, int(round(wpm)), pitch_modulation, word_count, duration_seconds)
        print("Feedback received.")

        metrics = {
            'transcript': transcript, 'wpm': int(round(wpm)),
            'pitchModulation': float(round(pitch_modulation, 2)),
            'duration': float(round(duration_seconds, 2)),
            'audioURL': audio_url, **analysis
        }

        print("Analysis successful. Returning results.")
        return jsonify(metrics)

    except Exception as e:
        print(f"An unexpected error occurred in analyze_speech: {traceback.format_exc()}")
        return jsonify({'error': 'An internal server error occurred.', 'details': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


if __name__ == '__main__':
    from waitress import serve

    print("Starting server with waitress on http://0.0.0.0:5000")
    serve(app, host='0.0.0.0', port=5000)



# import os
# import numpy as np
# import librosa
# from faster_whisper import WhisperModel
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from pydub import AudioSegment
# import traceback
# import json
# import requests
# from dotenv import load_dotenv
#
# # --- SETUP ---
# load_dotenv()
# app = Flask(__name__)
# CORS(app)
#
# # --- HUGGING FACE SETUP ---
# API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-large"
# HF_TOKEN = os.getenv("HF_TOKEN")
# headers = {"Authorization": f"Bearer {HF_TOKEN}"}
#
# # --- WHISPER MODEL LOADING ---
# print("Loading Whisper speech-to-text model...")
# try:
#     whisper_model = WhisperModel("medium", device="cuda", compute_type="float16")
#     print("Whisper 'medium' model loaded successfully on GPU.")
# except Exception as e:
#     print(f"GPU model loading failed: {e}. Falling back to CPU.")
#     whisper_model = WhisperModel("medium", device="cpu", compute_type="int8")
#     print("Whisper 'medium' model loaded on CPU.")
#
#
# # --- HELPER FUNCTIONS ---
# def analyze_pitch(filepath):
#     try:
#         y, sr = librosa.load(filepath)
#         pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
#         pitch_values = [pitches[magnitudes[:, t].argmax(), t] for t in range(pitches.shape[1]) if
#                         pitches[magnitudes[:, t].argmax(), t] > 0]
#         if len(pitch_values) > 1: return float(np.std(pitch_values))
#         return 0.0
#     except Exception as e:
#         print(f"Could not analyze pitch: {e}")
#         return 0.0
#
#
# def get_ai_feedback(transcript, wpm, pitch_modulation):
#     if not HF_TOKEN:
#         return {"confidenceScore": 0, "feedback": "AI model is not available.", "improvements": [], "mistakes": []}
#
#     # --- NEW, MORE DETAILED PROMPT ---
#     prompt = f"""
#     Analyze the following speech data from a user practicing their public speaking.
#     Act as an expert, encouraging, and detailed speech coach.
#
#     Data:
#     - Transcript: "{transcript}"
#     - Speaking Pace: {wpm} Words Per Minute (An ideal conversational pace is between 130-160 WPM)
#     - Pitch Modulation: {pitch_modulation:.2f} (A good value is above 30, indicating good vocal variety)
#
#     Provide your analysis in a strict JSON format. Do not include any text outside of the JSON object.
#
#     The JSON object must have these exact keys:
#     {{
#       "confidenceScore": <An integer from 0-100 based on the clarity and flow of the transcript.>,
#       "feedback": "<A detailed, one-paragraph summary. Start with encouragement, mention a key strength, and introduce the main area for improvement. Be specific.>",
#       "improvements": [
#         {{
#           "point": "<A short title for the first improvement area. e.g., 'Varying Sentence Structure'.>",
#           "explanation": "<A detailed, multi-sentence explanation of why this improvement is important and how the user can practice it.>"
#         }},
#         {{
#           "point": "<A short title for the second improvement area. e.g., 'Strategic Pausing'.>",
#           "explanation": "<A detailed, multi-sentence explanation for the second point.>"
#         }}
#       ],
#       "mistakes": [
#         {{
#           "point": "<A short title for a specific mistake found. e.g., 'Use of Filler Words'.>",
#           "explanation": "<A detailed, multi-sentence explanation of the mistake, including examples from the transcript if possible, and why it's a problem.>"
#         }}
#       ]
#     }}
#     """
#
#     payload = {"inputs": prompt, "parameters": {"max_new_tokens": 1024}}
#
#     try:
#         response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
#         response.raise_for_status()
#         result = response.json()
#         generated_text = result[0]['generated_text']
#
#         json_start = generated_text.find('{')
#         json_end = generated_text.rfind('}') + 1
#         if json_start == -1 or json_end == 0:
#             raise ValueError("No JSON object found in the AI response.")
#
#         json_response_text = generated_text[json_start:json_end]
#         return json.loads(json_response_text)
#
#     except Exception as e:
#         print(f"CRITICAL: Failed to get or parse JSON from AI. Error: {e}")
#         # Provide a fallback with rule-based feedback if AI fails
#         return {"confidenceScore": 50, "feedback": "AI analysis failed, providing basic feedback.",
#                 "improvements": [{"point": "Pacing", "explanation": "Aim for a pace between 130-160 WPM."}],
#                 "mistakes": [
#                     {"point": "AI Connection", "explanation": f"Could not connect to the AI service. Error: {str(e)}"}]}
#
#
# # --- MAIN API ROUTE ---
# # This function remains the same.
# @app.route('/analyze', methods=['POST'])
# def analyze_speech():
#     if 'audio' not in request.files or not whisper_model:
#         return jsonify({'error': 'No audio file or required models are missing'}), 400
#
#     audio_file = request.files['audio']
#     uploads_dir = 'uploads'
#     if not os.path.exists(uploads_dir): os.makedirs(uploads_dir)
#     filepath = os.path.join(uploads_dir, "temp_recording.wav")
#     audio_file.save(filepath)
#
#     try:
#         sound = AudioSegment.from_file(filepath)
#         sound.export(filepath, format="wav")
#
#         segments, info = whisper_model.transcribe(filepath, beam_size=5)
#         transcript = "".join(segment.text for segment in segments).strip()
#         print(f"Transcription complete. Transcript: '{transcript}'")
#
#         if not transcript or len(transcript.split()) < 2:
#             return jsonify({
#                 'transcript': transcript, 'wpm': 0, 'pitchModulation': 0.0, 'duration': 0.0,
#                 'confidenceScore': 0, 'feedback': 'Recording was too short or silent.',
#                 'improvements': ['Try speaking clearly for at least 3-5 seconds.'],
#                 'mistakes': ['No speech was detected.']
#             })
#
#         duration_seconds = len(sound) / 1000.0
#         word_count = len(transcript.split())
#         wpm = (word_count / duration_seconds) * 60 if duration_seconds > 0 else 0
#         pitch_modulation = analyze_pitch(filepath)
#
#         print("Getting local AI and rule-based feedback...")
#         analysis = get_ai_feedback(transcript, int(round(wpm)), pitch_modulation)
#         print("Feedback received.")
#
#         metrics = {
#             'transcript': transcript,
#             'wpm': int(round(wpm)),
#             'pitchModulation': float(round(pitch_modulation, 2)),
#             'duration': float(round(duration_seconds, 2)),
#             **analysis
#         }
#
#         print("Analysis successful. Returning results.")
#         return jsonify(metrics)
#
#     except Exception as e:
#         print(f"An unexpected error occurred in analyze_speech: {traceback.format_exc()}")
#         return jsonify({'error': 'An internal server error occurred.', 'details': str(e)}), 500
#     finally:
#         if os.path.exists(filepath):
#             os.remove(filepath)
#
#
# if __name__ == '__main__':
#     from waitress import serve
#
#     print("Starting server with waitress on http://0.0.0.0:5000")
#     serve(app, host='0.0.0.0', port=5000)





# import os
# import numpy as np
# import librosa
# from faster_whisper import WhisperModel
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from pydub import AudioSegment
# import traceback
# import json
# from dotenv import load_dotenv
# # --- NEW IMPORTS FOR LOCAL AI ---
# import torch
# from transformers import pipeline
#
# # --- SETUP ---
# load_dotenv()
# app = Flask(__name__)
# CORS(app)
#
# # --- LOCAL AI MODEL LOADING ---
#
# # 1. WHISPER MODEL (SPEECH-TO-TEXT)
# print("Loading Whisper speech-to-text model...")
# try:
#     whisper_model = WhisperModel("medium", device="cuda", compute_type="float16")
#     print("Whisper 'medium' model loaded successfully on GPU.")
# except Exception as e:
#     print(f"GPU model loading failed for Whisper: {e}. Falling back to CPU.")
#     whisper_model = WhisperModel("medium", device="cpu", compute_type="int8")
#     print("Whisper 'medium' model loaded on CPU.")
#
# # 2. SENTIMENT ANALYSIS MODEL (FOR CONFIDENCE SCORE)
# print("Loading local sentiment analysis model...")
# try:
#     # This creates a pipeline that runs the sentiment model on your GPU (device=0)
#     sentiment_pipeline = pipeline(
#         "sentiment-analysis",
#         model="distilbert-base-uncased-finetuned-sst-2-english",
#         device=0 if torch.cuda.is_available() else -1  # Use GPU if available
#     )
#     print("Sentiment analysis model loaded successfully.")
# except Exception as e:
#     print(f"CRITICAL ERROR: Could not load sentiment analysis model. {e}")
#     sentiment_pipeline = None
#
#
# # --- HELPER FUNCTIONS ---
# def analyze_pitch(filepath):
#     """Analyzes the pitch of an audio file to determine vocal modulation."""
#     try:
#         y, sr = librosa.load(filepath)
#         pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
#         pitch_values = [pitches[magnitudes[:, t].argmax(), t] for t in range(pitches.shape[1]) if
#                         pitches[magnitudes[:, t].argmax(), t] > 0]
#         if len(pitch_values) > 1:
#             return float(np.std(pitch_values))
#         return 0.0
#     except Exception as e:
#         print(f"Could not analyze pitch: {e}")
#         return 0.0
#
#
# def get_feedback(transcript, wpm, pitch_modulation):
#     """
#     Uses the local sentiment AI for confidence and smart rules for other feedback.
#     """
#     # 1. Get Confidence Score from LOCAL Sentiment Analysis AI
#     confidence_score = 50  # Default score
#     if sentiment_pipeline:
#         try:
#             result = sentiment_pipeline(transcript)
#             # The result is a list with a dict, e.g., [{'label': 'POSITIVE', 'score': 0.99...}]
#             if result[0]['label'] == 'POSITIVE':
#                 confidence_score = int(result[0]['score'] * 100)
#             else:  # If sentiment is NEGATIVE
#                 confidence_score = int((1 - result[0]['score']) * 50)  # Lower confidence for negative speech
#         except Exception as e:
#             print(f"Could not get local AI sentiment analysis: {e}")
#             confidence_score = 50
#
#             # 2. Generate Rule-Based Feedback
#     feedback = "Your practice session has been analyzed."
#     improvements = []
#     mistakes = []
#
#     # Pace feedback
#     if wpm > 170:
#         mistakes.append(f"Your pace was quite fast at {wpm} WPM. This can be hard for listeners to follow.")
#         improvements.append("Try pausing briefly between key points to let your message sink in.")
#     elif wpm < 120:
#         mistakes.append(f"Your pace was a bit slow at {wpm} WPM.")
#         improvements.append("Try speaking with a bit more energy to keep your audience engaged.")
#     else:
#         feedback += " Your speaking pace was excellent, right in the ideal range."
#
#     # Pitch feedback
#     if pitch_modulation < 25:
#         mistakes.append("Your vocal delivery was a bit monotone.")
#         improvements.append("Practice varying your pitch to add more emphasis and emotion to your words.")
#     else:
#         feedback += " You used great vocal variety."
#
#     # Filler word analysis
#     filler_words = ['uh', 'um', 'like', 'you know', 'so', 'actually', 'basically']
#     transcript_lower = transcript.lower()
#     found_fillers = [word for word in filler_words if f" {word} " in transcript_lower]
#     if found_fillers:
#         mistakes.append(f"Some filler words like '{', '.join(found_fillers)}' were detected.")
#         improvements.append("Try to pause silently instead of using filler words when you need to think.")
#
#     if not mistakes:
#         mistakes.append("No major mistakes detected. Great job!")
#     if not improvements:
#         improvements.append("Keep practicing to build even more consistency.")
#
#     return {
#         "confidenceScore": confidence_score,
#         "feedback": feedback,
#         "improvements": improvements,
#         "mistakes": mistakes
#     }
#
#
# # --- MAIN API ROUTE ---
# @app.route('/analyze', methods=['POST'])
# def analyze_speech():
#     if 'audio' not in request.files or not whisper_model:
#         return jsonify({'error': 'No audio file or required models are missing'}), 400
#
#     audio_file = request.files['audio']
#     uploads_dir = 'uploads'
#     if not os.path.exists(uploads_dir): os.makedirs(uploads_dir)
#     filepath = os.path.join(uploads_dir, "temp_recording.wav")
#     audio_file.save(filepath)
#
#     try:
#         sound = AudioSegment.from_file(filepath)
#         sound.export(filepath, format="wav")
#
#         segments, info = whisper_model.transcribe(filepath, beam_size=5)
#         transcript = "".join(segment.text for segment in segments).strip()
#         print(f"Transcription complete. Transcript: '{transcript}'")
#
#         if not transcript or len(transcript.split()) < 2:
#             return jsonify({
#                 'transcript': transcript, 'wpm': 0, 'pitchModulation': 0.0, 'duration': 0.0,
#                 'confidenceScore': 0, 'feedback': 'Recording was too short or silent.',
#                 'improvements': ['Try speaking clearly for at least 3-5 seconds.'],
#                 'mistakes': ['No speech was detected.']
#             })
#
#         duration_seconds = len(sound) / 1000.0
#         word_count = len(transcript.split())
#         wpm = (word_count / duration_seconds) * 60 if duration_seconds > 0 else 0
#         pitch_modulation = analyze_pitch(filepath)
#
#         print("Getting local AI and rule-based feedback...")
#         analysis = get_feedback(transcript, int(round(wpm)), pitch_modulation)
#         print("Feedback received.")
#
#         metrics = {
#             'transcript': transcript,
#             'wpm': int(round(wpm)),
#             'pitchModulation': float(round(pitch_modulation, 2)),
#             'duration': float(round(duration_seconds, 2)),
#             **analysis
#         }
#
#         print("Analysis successful. Returning results.")
#         return jsonify(metrics)
#
#     except Exception as e:
#         print(f"An unexpected error occurred in analyze_speech: {traceback.format_exc()}")
#         return jsonify({'error': 'An internal server error occurred.', 'details': str(e)}), 500
#     finally:
#         if os.path.exists(filepath):
#             os.remove(filepath)
#
#
# if __name__ == '__main__':
#     from waitress import serve
#
#     print("Starting server with waitress on http://0.0.0.0:5000")
#     serve(app, host='0.0.0.0', port=5000)