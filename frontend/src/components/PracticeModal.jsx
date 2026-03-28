import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import FaceDetectionCamera from "./FaceDetectionCamera";
import prompts from "../prompts";

const BACKEND_URL = "http://127.0.0.1:5000/analyze";
const MIN_RECORDING_TIME_MS = 3000;

const Spinner = () => (
  <svg
    style={{
      animation: "spin 1s linear infinite",
      height: "20px",
      width: "20px"
    }}
    viewBox="0 0 24 24"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="#c7d2fe"
      strokeWidth="4"
    />
    <path
      fill="none"
      stroke="#4f46e5"
      strokeWidth="4"
      strokeLinecap="round"
      d="M4 12a8 8 0 018-8"
    />
  </svg>
);

const PracticeModal = ({ onClose, onAnalysisComplete }) => {
  const { user } = useAuth();

  const [status, setStatus] = useState("Click 'Start Recording' or 'Get a Prompt'.");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [canStop, setCanStop] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [recordingMode, setRecordingMode] = useState("audio");
  const [facialMetrics, setFacialMetrics] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const stopTimerRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(stopTimerRef.current);
  }, []);

  // ---------------- PROMPT ----------------
  const getNewPrompt = () => {
    const random = prompts[Math.floor(Math.random() * prompts.length)];
    setCurrentPrompt(random);
  };

  // ---------------- RECORDING ----------------
  const handleStartRecording = async () => {
    try {
      setError("");
      setAnalysisResult(null);
      setCanStop(false);
      setStatus("Recording... Speak clearly.");
      sessionIdRef.current = `session_${Date.now()}`;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        uploadAudio(blob);
      };

      recorder.start();
      setIsRecording(true);

      stopTimerRef.current = setTimeout(() => {
        setCanStop(true);
        setStatus("Recording... You can stop now.");
      }, MIN_RECORDING_TIME_MS);
    } catch (err) {
      setError("Microphone access denied.");
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsAnalyzing(true);
    setStatus("Analyzing...");
  };

  // ---------------- UPLOAD ----------------
  const uploadAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      if (user) formData.append("uid", user.uid);

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setAnalysisResult(data);
      setIsAnalyzing(false);
      setStatus("Analysis complete");

      onAnalysisComplete?.(data);
    } catch (err) {
      setError("Upload failed.");
      setIsAnalyzing(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="modal-overlay">
      <div className="modal-content">

        {/* Header */}
        <div className="modal-header">
          <h2 className="title">New Practice Session</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
  <button
    onClick={() => setRecordingMode("audio")}
    disabled={isRecording || isAnalyzing}
    style={{
      flex: 1,
      padding: '0.75rem',
      borderRadius: '8px',
      border: 'none',
      fontSize: '0.9rem',
      fontWeight: '600',
      cursor: isRecording || isAnalyzing ? 'not-allowed' : 'pointer',
      background: recordingMode === "audio"
        ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
        : '#e5e7eb',
      color: recordingMode === "audio" ? '#fff' : '#374151',
      boxShadow: recordingMode === "audio"
        ? '0 4px 12px rgba(79, 70, 229, 0.3)'
        : 'none',
      opacity: isRecording || isAnalyzing ? 0.6 : 1,
      transition: 'all 0.2s ease'
    }}
  >
    🎤 Audio Only
  </button>

  <button
    onClick={() => setRecordingMode("video")}
    disabled={isRecording || isAnalyzing}
    style={{
      flex: 1,
      padding: '0.75rem',
      borderRadius: '8px',
      border: 'none',
      fontSize: '0.9rem',
      fontWeight: '600',
      cursor: isRecording || isAnalyzing ? 'not-allowed' : 'pointer',
      background: recordingMode === "video"
        ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
        : '#e5e7eb',
      color: recordingMode === "video" ? '#fff' : '#374151',
      boxShadow: recordingMode === "video"
        ? '0 4px 12px rgba(79, 70, 229, 0.3)'
        : 'none',
      opacity: isRecording || isAnalyzing ? 0.6 : 1,
      transition: 'all 0.2s ease'
    }}
  >
    📹 Video + AI Coach
  </button>
</div>

        {/* Camera */}
        {recordingMode === "video" && isRecording && (
          <div className="camera-container">
            <FaceDetectionCamera
              sessionId={sessionIdRef.current}
              isRecording={isRecording}
            />
          </div>
        )}

        {/* Prompt */}
        {currentPrompt && (
          <div className="modal-prompt-display">
            <span className="prompt-title">Your Prompt:</span>
            <p className="prompt-text">"{currentPrompt}"</p>
          </div>
        )}

        {/* Status */}
        <div className="modal-status">
          <div className="modal-status-text">
            {isAnalyzing && <Spinner />}
            <span>{status}</span>
          </div>
          {error && <p className="modal-error-text">{error}</p>}
        </div>

        {/* Buttons */}
        <div className="modal-buttons">
          <button
            onClick={getNewPrompt}
            disabled={isRecording || isAnalyzing}
            className="modal-button prompt-button"
          >
            Get a Prompt
          </button>

          <div className="record-controls">
            <button
              onClick={handleStartRecording}
              disabled={isRecording || isAnalyzing}
              className="modal-button start-button"
            >
              Start Recording
            </button>

            <button
              onClick={handleStopRecording}
              disabled={!isRecording || !canStop}
              className="modal-button stop-button"
            >
              Stop Recording
            </button>
          </div>
        </div>

        {/* Result */}
        {analysisResult && (
  <div className="instant-report">

  {/* Transcript full width */}
  <div className="instant-report-section">
    <h3>Transcript</h3>
    <p>"{analysisResult.transcript}"</p>
  </div>

  {/* 🔥 GRID START */}
  <div className="report-grid">

    <div className="instant-report-section">
      <h3>Speaking Pace (WPM)</h3>
      <h2>{analysisResult.wpm}</h2>
      <p>{analysisResult.analysis?.pacingAnalysis?.recommendation}</p>
    </div>

    <div className="instant-report-section">
      <h3>Confidence Score</h3>
      <h2>{analysisResult.analysis?.confidenceScore}%</h2>
    </div>

    <div className="instant-report-section">
      <h3>Vocal Variety Score</h3>
      <h2>{analysisResult.pitchModulation?.toFixed(1)}</h2>
      <p>{analysisResult.analysis?.vocalVarietyAnalysis?.recommendation}</p>
    </div>

    <div className="instant-report-section">
      <h3>Duration</h3>
      <h2>{analysisResult.duration?.toFixed(2)} sec</h2>
    </div>

  </div>
  {/* 🔥 GRID END */}

  <div className="instant-report-section">
    <h3>Overall Feedback</h3>
    <p>{analysisResult.analysis?.overallFeedback}</p>
  </div>

  {/* Rest remains same */}

</div>
)}

      </div>
    </div>
  );
};

export default PracticeModal;