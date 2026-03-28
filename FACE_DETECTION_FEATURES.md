# AI Practice Coach - Face Detection & Facial Metrics Features

## Overview

This document describes the new AI Practice Coach features that have been added to your React/Flask application. The system now supports real-time face detection, facial expression analysis, and integrated AI feedback based on both audio and facial metrics.

## New Features

### 1. **Face Detection Camera Component**
- **File**: `frontend/src/components/FaceDetectionCamera.jsx`
- Real-time face detection using MediaPipe Face Detection
- Live visualization with face boundary box
- Calculates three key metrics during recording:
  - **Engagement Score**: Measures attentiveness and presence (0-100%)
  - **Confidence Score**: Based on facial expressions and eye contact (0-100%)
  - **Eye Contact Score**: Measures how centered the face is (0-100%)

**Features:**
- Browser-based processing (privacy-preserving)
- Real-time metric calculation at 5-frame intervals
- Visual feedback with metric bars
- Face detection status badge

### 2. **Facial Analysis Report Component**
- **File**: `frontend/src/components/FacialAnalysisReport.jsx`
- Comprehensive post-session facial analysis display
- Charts and visualizations:
  - Performance metrics bar chart
  - Emotion breakdown pie chart
  - Individual emotion percentages

**Displays:**
- Average engagement, confidence, and consistency scores
- Dominant emotion detection
- Emotion breakdown (happy, sad, angry, neutral, surprised, disgusted, fearful)
- Key insights and personalized recommendations

### 3. **Enhanced Practice Modal**
- **File**: `frontend/src/components/PracticeModal.jsx`
- New mode toggle: "Audio Only" vs "Video + AI Coach"
- Integrates FaceDetectionCamera when video mode is selected
- Collects facial metrics during recording
- Sends facial metrics to backend for enhanced AI analysis

### 4. **Backend Facial Metrics Service**
- **File**: `backend/facial_metrics.py`
- `FacialMetricsAnalyzer` class for processing video frames
- Frame-by-frame facial analysis using DeepFace library
- Emotion detection (7 emotion categories)
- Engagement and confidence scoring
- Eye contact estimation
- Session summary generation

**Key Methods:**
```python
analyzer = FacialMetricsAnalyzer()
analyzer.reset_session()  # Start new session
metrics = analyzer.analyze_frame(frame_base64)  # Process single frame
summary = analyzer.get_session_summary()  # Get session stats
```

### 5. **WebSocket Support for Real-Time Streaming**
- **Framework**: Flask-SocketIO
- Real-time bidirectional communication between frontend and backend

**WebSocket Events:**
- `connect`: Client connects to server
- `start_facial_analysis`: Initialize facial analysis session
- `process_frame`: Send video frame for analysis
- `end_facial_analysis`: Finalize session and get summary
- `frame_metrics`: Receive processed metrics (server → client)

### 6. **Enhanced AI Feedback**
- **Endpoint**: `/analyze-with-facial-metrics` (POST)
- New `get_ai_feedback_with_facial()` function in `app.py`
- Integrates Gemini AI feedback with facial context
- Generates personalized recommendations based on:
  - Speaking pace (WPM)
  - Vocal variety (pitch modulation)
  - Facial engagement and confidence
  - Emotional expressions
  - Eye contact patterns

## Technical Stack

### Backend Dependencies (New)
```
Flask-SocketIO          # WebSocket support
python-socketio         # Socket.IO server
python-engineio         # Engine.IO protocol
deepface               # Facial emotion/analysis
mediapipe              # Face detection
Pillow                 # Image processing
```

### Frontend Dependencies (New)
```
@mediapipe/face_detection    # Face detection library
@mediapipe/drawing_utils     # Drawing utilities
socket.io-client             # WebSocket client
```

## Installation & Setup

### Backend Setup

1. **Install new dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

The following new packages will be installed:
- Flask-SocketIO
- python-socketio
- python-engineio
- deepface
- mediapipe
- Pillow

2. **Update environment variables** (if using Gemini for enhanced feedback):
Ensure `.env` file includes:
```
GOOGLE_API_KEY=your_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
```

3. **Run the Flask server:**
```bash
python app.py
```
The server will run with WebSocket support on `http://0.0.0.0:5000`

### Frontend Setup

1. **Install new dependencies:**
```bash
cd frontend
npm install
```

2. **Run the development server:**
```bash
npm run dev
```

## Usage Guide

### For Users

#### Starting a Practice Session with Video + AI Coach

1. Click "New Practice Session" or the practice button
2. Toggle "📹 Video + AI Coach" mode (instead of "🎤 Audio Only")
3. Grant camera and microphone permissions
4. Click "Get a Prompt" to get a speech prompt
5. Click "Start Recording" to begin
6. Speak while looking at the camera
7. Watch real-time metrics: Engagement, Confidence, Eye Contact
8. Click "Stop Recording" when done
9. Wait for analysis (up to 1 minute)
10. Review:
    - Overall feedback and confidence score
    - Pacing and vocal variety analysis
    - **NEW**: Facial expression feedback
    - Detailed analysis (filler words, grammatical errors, etc.)
    - Key improvements
    - Recorded audio

#### Understanding Facial Metrics

- **Engagement Score (0-100)**
  - Measures: Face size, position, presence in frame
  - Higher = More animated and present
  - Lower = Less engaged

- **Confidence Score (0-100)**
  - Measures: Facial expressions, emotion positivity
  - Higher = More confident, happier expressions
  - Lower = More anxious, negative expressions

- **Eye Contact Score (0-100)**
  - Measures: How centered face is in camera view
  - Higher = Better eye contact/camera positioning
  - Lower = Looking away from camera

### For Developers

#### Using FaceDetectionCamera Component

```jsx
import FaceDetectionCamera from './components/FaceDetectionCamera';

<FaceDetectionCamera
  sessionId="session_123"
  onMetricsUpdate={(metrics) => {
    console.log('Updated metrics:', metrics);
  }}
  isRecording={true}
/>
```

#### Backend Facial Analysis API

**Endpoint**: `POST /analyze-with-facial-metrics`

**Request:**
```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.wav');
formData.append('uid', userId);
formData.append('facialMetrics', JSON.stringify({
  average_engagement_score: 75,
  average_confidence_score: 80,
  average_eye_contact_score: 65,
  total_frames_analyzed: 150,
  emotion_breakdown: { happy: 60, neutral: 30, sad: 10 },
  dominant_emotion: 'happy',
  consistency_score: 85
}));

fetch('http://localhost:5000/analyze-with-facial-metrics', {
  method: 'POST',
  body: formData
});
```

**Response:**
```json
{
  "transcript": "The speech transcript...",
  "wpm": 145,
  "pitchModulation": 35.5,
  "duration": 25.3,
  "audioURL": "https://cloudinary.com/...",
  "facialMetrics": {
    "average_engagement_score": 75,
    "average_confidence_score": 80,
    "emotion_breakdown": { "happy": 60, "neutral": 30, "sad": 10 },
    "dominant_emotion": "happy",
    "consistency_score": 85
  },
  "analysis": {
    "overallFeedback": "Great job! Your engagement was high and confidence showed through.",
    "confidenceScore": 82,
    "facialAnalysis": {
      "assessment": "You maintained good engagement and showed positive emotions.",
      "recommendation": "Continue to maintain this eye contact and animated expressions."
    },
    "pacingAnalysis": { ... },
    "vocalVarietyAnalysis": { ... },
    "keyImprovements": [ ... ]
  }
}
```

## File Structure

```
React/
├── backend/
│   ├── app.py                    # Updated with WebSocket & facial endpoints
│   ├── facial_metrics.py         # NEW: Facial analysis module
│   ├── requirements.txt          # Updated dependencies
│   └── uploads/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FaceDetectionCamera.jsx        # NEW: Real-time camera
│   │   │   ├── FaceDetectionCamera.css        # NEW: Camera styles
│   │   │   ├── FacialAnalysisReport.jsx       # NEW: Analysis display
│   │   │   ├── FacialAnalysisReport.css       # NEW: Report styles
│   │   │   ├── PracticeModal.jsx              # Updated with video mode
│   │   │   └── ...other components...
│   │   └── ...
│   ├── package.json              # Updated dependencies
│   └── ...
└── ...
```

## Performance Considerations

### Optimization Tips

1. **Frame Processing Rate**: Set to 5-frame intervals to reduce server load
2. **Compression**: Frames are sent as base64, consider compression for high-res
3. **GPU Usage**: DeepFace uses GPU if available (NVIDIA CUDA)
4. **Memory**: Clear old frame data periodically

### Recommended Hardware

- **CPU**: Modern multi-core processor
- **GPU**: NVIDIA GPU recommended for deepface (e.g., GTX 1060+)
- **RAM**: 8GB minimum, 16GB recommended
- **Network**: Stable connection for WebSocket

## Troubleshooting

### Face Detection Not Working
- Check camera permissions in browser settings
- Ensure good lighting
- Position face directly facing camera
- Try a different browser (Chrome/Firefox/Edge)

### Metrics Not Updating
- Verify WebSocket connection: Check browser console
- Ensure backend is running: `python app.py`
- Check network tab for WebSocket handshake

### Slow Analysis
- Reduce video resolution or frame rate
- Check GPU availability: `nvidia-smi`
- Reduce Gemini AI model complexity

### Camera Permission Denied
- Check browser permissions
- Restart browser
- Clear browser cache
- Try in private/incognito mode

## Privacy & Security

- **Local Processing**: Face detection runs on the browser (privacy-preserving)
- **Frame Sampling**: Only sampled frames sent to backend (every 5 frames)
- **No Video Storage**: Raw video not stored (only audio)
- **Facial Metrics Only**: Only computed metrics sent, not raw images
- **User Data**: Associated with Firebase user ID

## Future Enhancements

Potential features for future versions:

1. **Eye Tracking**: More advanced eye contact detection
2. **Gesture Recognition**: Hand/body gesture analysis
3. **Emotion Timeline**: Emotion changes throughout session
4. **Comparison Reports**: Track improvement over multiple sessions
5. **Group Presentations**: Multi-person face detection for group practice
6. **Custom Metrics**: User-defined facial analysis criteria
7. **Video Recording**: Store processed videos for review
8. **Real-time Corrections**: AI coaching during session (not post-hoc)

## Support & Debugging

### Debug Mode

Enable logging in facial_metrics.py:
```python
# Add to facial_metrics.py
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
```

### Check WebSocket Connection

In browser console:
```javascript
console.log(socket); // Should show connected state
```

### Backend Logs

Watch for errors:
```bash
tail -f backend_logs.txt
```

## References

- [MediaPipe Face Detection](https://developers.google.com/mediapipe/solutions/vision/face_detection)
- [DeepFace GitHub](https://github.com/serengp/deepface)
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/)
- [Google Gemini API](https://ai.google.dev/)

## License & Attribution

This feature set includes:
- MediaPipe (Google) - Apache 2.0 License
- DeepFace (Serengp) - MIT License
- Flask-SocketIO (Miguel Grinberg) - MIT License

## Questions?

For issues or feature requests, refer to the plan documentation or contact the development team.

