# AI Practice Coach with Face Detection - Complete Setup Guide

## 📋 Overview

This document provides comprehensive instructions for setting up and using the new face detection and AI coaching features in your React/Flask application.

## ✨ What's New

### New Components
1. **FaceDetectionCamera** - Real-time face detection with MediaPipe
2. **FacialAnalysisReport** - Post-session analysis visualization
3. **Enhanced PracticeModal** - Video mode with face detection
4. **FacialMetricsAnalyzer** - Backend facial analysis service
5. **WebSocket Support** - Real-time communication with Flask-SocketIO

### New Capabilities
- Real-time engagement, confidence, and eye contact scoring
- Emotion detection and breakdown
- Facial-informed AI feedback from Gemini
- Multi-mode practice sessions (audio-only or video+audio)

---

## 🛠️ Installation Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Modern browser with camera access (Chrome, Firefox, Edge)
- NVIDIA GPU (optional, but recommended for deepface)

### Step 1: Backend Setup

**1a. Install Python Dependencies**

Navigate to backend directory:
```bash
cd backend
```

Install all required packages (new ones included in requirements.txt):
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**New dependencies added:**
- `Flask-SocketIO>=5.1.0` - WebSocket support
- `python-socketio>=5.0.0` - Socket protocol
- `python-engineio>=4.0.0` - Engine protocol
- `deepface>=0.0.75` - Facial analysis
- `mediapipe>=0.8.0` - Face detection
- `Pillow>=9.0.0` - Image processing

**1b. Configure Environment Variables**

Ensure your `.env` file in backend folder contains:
```env
# Google Gemini API
GOOGLE_API_KEY=your_api_key_here

# Cloudinary Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
```

**1c. Verify Backend Models**

The backend will automatically download required models on first run:
- Whisper model (for speech-to-text)
- Gemini model (for AI feedback)

First run takes 3-5 minutes to download models (~2GB).

### Step 2: Frontend Setup

**2a. Install Node Dependencies**

Navigate to frontend directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

**New dependencies added:**
- `@mediapipe/face_detection` - Face detection library
- `@mediapipe/drawing_utils` - Drawing utilities for visualization
- `socket.io-client` - WebSocket client

**2b. Configure Backend URL (if not localhost)**

Edit `frontend/src/components/PracticeModal.jsx`:
```javascript
const BACKEND_URL = "http://YOUR_BACKEND_URL:5000/analyze";
const BACKEND_URL_WITH_FACIAL = "http://YOUR_BACKEND_URL:5000/analyze-with-facial-metrics";
```

### Step 3: Start the Application

**Terminal 1: Start Backend Server**
```bash
cd backend
python app.py
```

Expected output:
```
Loading local Whisper model...
Whisper 'medium' model loaded successfully on GPU.
Gemini AI model 'gemini-2.5-flash' configured successfully.
 * Running on http://0.0.0.0:5000
```

**Terminal 2: Start Frontend Dev Server**
```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v4.4.11  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
```

**Terminal 3 (Optional): Monitor Backend Logs**
```bash
cd backend
tail -f app.log  # If you configure logging
```

---

## 🎯 Usage Guide

### For End Users

#### Start a Practice Session with Video + Face Detection

1. **Navigate to Dashboard**
   - Login to your account
   - You're on the Dashboard page

2. **Open Practice Modal**
   - Click the "Practice" button or "New Practice Session"
   - A modal dialog opens

3. **Select Video Mode**
   - Click "📹 Video + AI Coach" button
   - Browser asks for camera and microphone permissions
   - Click "Allow"

4. **Get a Prompt**
   - Click "Get a Prompt" button
   - A speech prompt appears
   - Read it carefully

5. **Start Recording**
   - Click "Start Recording" button
   - Camera feed shows your face with green boundary box
   - Face Detection Camera component appears if video mode is on
   - Real-time metrics display:
     - Engagement Score (blue)
     - Confidence Score (green)
     - Eye Contact Score (orange)

6. **Deliver Your Speech**
   - Speak clearly while looking at camera
   - Match your facial expressions to your message
   - Try to maintain eye contact with camera

7. **Stop Recording**
   - After minimum 3 seconds, "Stop Recording" button enables
   - Click "Stop Recording" when done
   - Button shows red color when active

8. **Wait for Analysis**
   - Status shows "Analyzing... This may take up to a minute."
   - Backend processes:
     - Audio transcription (Whisper)
     - Facial metrics aggregation
     - AI feedback generation (Gemini)

9. **Review Results**
   - Instant Report modal displays:
     - **Overall Feedback**: AI coach's summary
     - **Confidence Score**: 0-100 score
     - **Pacing Analysis**: WPM and recommendations
     - **Vocal Variety Analysis**: Pitch modulation insights
     - **NEW: Facial Analysis**: Engagement, confidence, emotion feedback
     - **Detailed Analysis**: Filler words, grammar, clarity issues
     - **Key Improvements**: Action items for next session
     - **Your Recording**: Audio player to listen to yourself

10. **Save Session**
    - Click "Done" to close report
    - Session automatically saved to Firebase
    - View in History page to track progress

#### Understanding the Metrics

**Engagement Score (0-100%)**
- What it measures: How animated and present you appear
- What affects it: Face size, facial expression, movement
- Goal: Maintain 70%+ engagement for presentations
- How to improve: Be more animated, smile, move expressively

**Confidence Score (0-100%)**
- What it measures: Emotional positivity in facial expressions
- What affects it: Smile, relaxed face, positive emotions
- Goal: Maintain 70%+ confidence
- How to improve: Practice beforehand, smile more, maintain composure

**Eye Contact Score (0-100%)**
- What it measures: How well-centered your face is in camera
- What affects it: Camera positioning, where you're looking
- Goal: Maintain 70%+ eye contact
- How to improve: Look directly at camera lens, position camera at eye level

**Emotion Breakdown**
- Happy: Shows enthusiasm and positivity
- Sad: Shows concern or seriousness (use for grave topics)
- Angry: Shows frustration (use sparingly)
- Neutral: Shows calmness and composure
- Surprised: Shows interest and engagement
- Disgusted: Shows disapproval (avoid)
- Fearful: Shows anxiety (avoid)

#### Tips for Best Results

1. **Lighting Setup**
   - Use natural light or soft lamp
   - Avoid harsh shadows on face
   - Position light in front, not behind

2. **Camera Positioning**
   - Eye level with camera
   - ~30-40 cm away from camera
   - Face fills 50-70% of frame
   - Plain background behind you

3. **Audio Quality**
   - Minimize background noise
   - Use microphone (not laptop mic if possible)
   - Speak clearly and distinctly

4. **Presentation Tips**
   - Maintain natural facial expressions
   - Show enthusiasm through face and voice
   - Keep eye contact with camera
   - Smile appropriately for content

---

### For Developers

#### Architecture Overview

```
User Interface
    ↓
[React Components]
├── PracticeModal.jsx (mode: "audio" or "video")
├── FaceDetectionCamera.jsx (when mode="video")
└── FacialAnalysisReport.jsx (display results)
    ↓
[WebSocket + HTTP]
    ↓
[Flask Backend]
├── /analyze (audio-only endpoint)
├── /analyze-with-facial-metrics (video mode endpoint)
├── WebSocket handlers (real-time metrics)
└── facial_metrics.py (FacialMetricsAnalyzer class)
    ↓
[External Services]
├── Whisper (speech-to-text)
├── DeepFace (emotion detection)
├── Gemini AI (feedback generation)
└── Cloudinary (audio storage)
    ↓
[Firebase]
└── Firestore (session storage)
```

#### Using FaceDetectionCamera Component

Import and use the component:

```jsx
import FaceDetectionCamera from './components/FaceDetectionCamera';

function MyComponent() {
  const [metrics, setMetrics] = useState([]);
  
  const handleMetricsUpdate = (newMetric) => {
    setMetrics(prev => [...prev, newMetric]);
    console.log('New metric:', newMetric);
    // Metric structure:
    // {
    //   engagement: 0-100,
    //   confidence: 0-100,
    //   eyeContact: 0-100,
    //   timestamp: ISO string,
    //   faceDetected: boolean
    // }
  };

  return (
    <FaceDetectionCamera
      sessionId="unique_session_id"
      onMetricsUpdate={handleMetricsUpdate}
      isRecording={true}
    />
  );
}
```

**Props:**
- `sessionId` (string): Unique identifier for session
- `onMetricsUpdate` (function): Called when metrics update
- `isRecording` (boolean): Whether recording is active

#### Using FacialAnalysisReport Component

```jsx
import FacialAnalysisReport from './components/FacialAnalysisReport';

// facialMetrics from server response
const facialMetrics = {
  average_engagement_score: 75,
  average_confidence_score: 82,
  emotion_breakdown: {
    happy: 60,
    neutral: 30,
    sad: 10
  },
  dominant_emotion: 'happy',
  consistency_score: 85,
  total_frames_analyzed: 150
};

<FacialAnalysisReport facialMetrics={facialMetrics} />
```

#### Backend API Endpoints

**Audio-Only Endpoint (existing)**
```
POST /analyze
Content-Type: multipart/form-data

Parameters:
- audio (file): WAV audio file
- uid (string, optional): Firebase user ID

Response:
{
  "transcript": "...",
  "wpm": 145,
  "pitchModulation": 35.5,
  "duration": 25.3,
  "audioURL": "https://...",
  "analysis": {
    "overallFeedback": "...",
    "confidenceScore": 82,
    ...
  }
}
```

**Video + Facial Metrics Endpoint (new)**
```
POST /analyze-with-facial-metrics
Content-Type: multipart/form-data

Parameters:
- audio (file): WAV audio file
- uid (string, optional): Firebase user ID
- facialMetrics (JSON): Facial metrics summary

Response:
{
  "transcript": "...",
  "wpm": 145,
  "pitchModulation": 35.5,
  "duration": 25.3,
  "audioURL": "https://...",
  "facialMetrics": {
    "average_engagement_score": 75,
    "average_confidence_score": 82,
    "emotion_breakdown": {...},
    "dominant_emotion": "happy",
    "consistency_score": 85,
    "total_frames_analyzed": 150
  },
  "analysis": {
    "overallFeedback": "...",
    "confidenceScore": 82,
    "facialAnalysis": {
      "assessment": "...",
      "recommendation": "..."
    },
    ...
  }
}
```

#### WebSocket Events

**Client to Server:**

```javascript
// Initialize facial analysis
socket.emit('start_facial_analysis', {
  sessionId: 'session_123'
});

// Send frame for analysis
socket.emit('process_frame', {
  sessionId: 'session_123',
  frame: 'data:image/jpeg;base64,...'
});

// Finalize analysis
socket.emit('end_facial_analysis', {
  sessionId: 'session_123'
});
```

**Server to Client:**

```javascript
// Analysis started
socket.on('analysis_started', (data) => {
  // { sessionId, status: 'ready' }
});

// Metrics received
socket.on('frame_metrics', (data) => {
  // { sessionId, metrics: {...}, timestamp }
});

// Analysis complete
socket.on('analysis_complete', (data) => {
  // { sessionId, summary: {...} }
});

// Error occurred
socket.on('analysis_error', (data) => {
  // { error: 'error message' }
});
```

#### Facial Metrics Module Usage

```python
from facial_metrics import FacialMetricsAnalyzer
import base64

# Initialize analyzer
analyzer = FacialMetricsAnalyzer()
analyzer.reset_session()

# Process video frames
for frame_base64 in video_frames:
    metrics = analyzer.analyze_frame(frame_base64)
    if metrics:
        print(f"Emotion: {metrics['dominant_emotion']}")
        print(f"Engagement: {metrics['engagement_score']}")

# Get session summary
summary = analyzer.get_session_summary()
# Returns:
# {
#   "total_frames_analyzed": 150,
#   "average_engagement_score": 75,
#   "average_confidence_score": 82,
#   "emotion_breakdown": {"happy": 60, "neutral": 30, "sad": 10},
#   "dominant_emotion": "happy",
#   "consistency_score": 85
# }
```

#### DeepFace Model Details

The facial_metrics.py uses DeepFace for:

```python
# Emotion analysis
emotions = DeepFace.analyze(frame, actions=['emotion'])
# Returns: {'emotion': {'angry': x, 'disgust': x, ...}}

# Face region detection
DeepFace.analyze(frame, actions=['age'])
# Returns: [{'region': {'x': x, 'y': y, 'w': w, 'h': h}, ...}]
```

Emotions detected:
- angry
- disgust
- fear
- happy
- sad
- surprise
- neutral

---

## 🔧 Troubleshooting

### Issue: Camera Permission Denied

**Symptoms:** "Unable to access camera" error

**Solutions:**
1. Check browser permissions:
   - Chrome: Settings → Privacy → Camera → Allow localhost
   - Firefox: about:preferences → Privacy → Camera
   - Edge: Settings → Privacy → Camera → Allow
2. Restart browser after allowing permissions
3. Try incognito/private mode
4. Ensure HTTPS if deploying (required for camera access)

### Issue: Face Not Detected

**Symptoms:** Green box not appearing, metrics stay at 0%

**Solutions:**
1. **Improve lighting:**
   - Use lamp or natural light
   - Avoid backlighting
   - Position light at 45° angle

2. **Adjust camera angle:**
   - Face camera directly
   - Position at eye level
   - Move closer if too far

3. **Check resolution:**
   - Ensure camera works (test in Zoom, etc.)
   - Try different camera if available
   - Restart browser

4. **Clear browser cache:**
   - Ctrl+Shift+Delete
   - Clear all cache
   - Reload page

### Issue: Backend Won't Start

**Symptoms:** "ModuleNotFoundError" or port 5000 in use

**Solutions:**

For module errors:
```bash
pip install --upgrade -r requirements.txt
python -m pip install --force-reinstall torch torchvision torchaudio
```

For port in use:
```bash
# Linux/Mac
lsof -i :5000 | grep LISTEN
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: WebSocket Connection Fails

**Symptoms:** Metrics not updating, console shows WebSocket error

**Solutions:**
1. Ensure backend is running: `python app.py`
2. Check backend URL in PracticeModal.jsx
3. Ensure CORS enabled (already configured in app.py)
4. Check firewall settings
5. Try different port if 5000 is blocked

### Issue: Slow Analysis/Processing

**Symptoms:** Analysis takes >2 minutes, or UI freezes

**Solutions:**
1. **Check GPU availability:**
   ```bash
   nvidia-smi
   ```
   If not available, CPU inference is slow.

2. **Reduce frame processing:**
   Edit FaceDetectionCamera.jsx, increase frame skip:
   ```javascript
   if (frameCountRef.current % 10 === 0) {  // Change 5 to 10
   ```

3. **Free up system resources:**
   - Close other applications
   - Check RAM usage: `Task Manager` → Performance
   - Restart backend if running long

4. **Optimize Gemini prompt:**
   Reduce prompt length in app.py get_ai_feedback_with_facial()

### Issue: Audio Not Recorded

**Symptoms:** Recording shows "No speech detected"

**Solutions:**
1. Check microphone in system settings
2. Test microphone in browser: `chrome://settings/content/microphone`
3. Try different microphone if available
4. Speak louder and closer to mic
5. Check that recording duration is 3+ seconds

### Issue: Metrics Show 0% Engagement

**Symptoms:** All metrics stay at 0%, no change observed

**Solutions:**
1. Ensure face detection is working (green box visible)
2. Check if FaceDetectionCamera component is mounted
3. Verify onMetricsUpdate callback is defined
4. Check browser console for errors
5. Try different browser

---

## 📊 Performance Monitoring

### Monitor Real-Time Performance

**Backend:**
```bash
# Watch CPU/GPU usage
watch -n 1 'nvidia-smi'  # GPU
top  # CPU
```

**Frontend:**
```javascript
// In browser console
performance.mark('frame-process-start');
// ... frame processing code ...
performance.mark('frame-process-end');
performance.measure('frame-process', 'frame-process-start', 'frame-process-end');
console.log(performance.getEntriesByName('frame-process')[0].duration, 'ms');
```

### Optimize Performance

1. **Reduce frame rate:** Increase interval from 5 to 10+ frames
2. **Lower resolution:** Modify VideoConstraints in FaceDetectionCamera
3. **Batch processing:** Process multiple frames per request
4. **Cache models:** Preload DeepFace and MediaPipe models

---

## 🔐 Security Considerations

### Privacy
- ✅ Face detection runs in browser (no face images sent)
- ✅ Only metrics uploaded (75 bytes per frame vs 60KB+ for image)
- ✅ No facial storage, only aggregated metrics
- ✅ User data associated with Firebase auth

### Data Handling
- All audio files encrypted in transit (HTTPS)
- Stored on Cloudinary with secure URLs
- Facial metrics stored in Firestore with user UID
- Automatic cleanup (optionally implement data retention policy)

### Recommended
- Use HTTPS in production
- Implement API rate limiting
- Add authentication token to WebSocket
- Validate all incoming data on backend

---

## 📈 Next Steps

### For Users
1. Record 3-4 practice sessions
2. Compare metrics across sessions
3. Focus on improving weakest metric
4. Track progress over weeks

### For Developers
1. Implement real-time corrections during recording
2. Add voice activity detection (VAD)
3. Implement gesture recognition
4. Add comparison/progress tracking
5. Build group presentation analysis
6. Create custom report generation

---

## 🎓 Learning Resources

- [MediaPipe Face Detection](https://developers.google.com/mediapipe/solutions/vision/face_detection)
- [DeepFace Docs](https://github.com/serengp/deepface)
- [Flask-SocketIO Docs](https://flask-socketio.readthedocs.io/)
- [Whisper API](https://github.com/openai/whisper)
- [Google Gemini API](https://ai.google.dev/)

---

## 📞 Support

### Getting Help
1. Check error logs: Backend console and browser console
2. Review this documentation
3. Check FACE_DETECTION_FEATURES.md for detailed API docs
4. Test individual components in isolation

### Reporting Issues
When reporting issues, include:
- Error message (exact text)
- Browser and OS
- Steps to reproduce
- Console logs (Dev Tools → Console)
- Network tab screenshots

---

Good luck with your AI Practice Coach implementation! 🎉

