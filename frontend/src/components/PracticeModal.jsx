import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// --- THIS IS THE CRITICAL LINE ---
// It now reads the backend URL from the Vercel environment variable.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const MIN_RECORDING_TIME_MS = 3000;

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const PracticeModal = ({ onClose, onAnalysisComplete }) => {
  const [status, setStatus] = useState("Click 'Start Recording' to begin.");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [canStop, setCanStop] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const { user } = useAuth();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const stopTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(stopTimerRef.current);
  }, []);

  const handleStartRecording = async () => {
    setError("");
    setCanStop(false);
    setAnalysisResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        uploadAudio(audioBlob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus("Recording... Speak clearly.");
      stopTimerRef.current = setTimeout(() => {
        setCanStop(true);
        setStatus("Recording... You can stop now.");
      }, MIN_RECORDING_TIME_MS);
    } catch (err) {
      setError("Could not access microphone. Please check browser permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      clearTimeout(stopTimerRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsAnalyzing(true);
      setStatus("Analyzing... this can take a moment.");
    }
  };

  const uploadAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    try {
      const response = await fetch(BACKEND_URL, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An unknown server error occurred.");
      }

      setAnalysisResult(data);
      onAnalysisComplete(data);

    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
      setStatus("An error occurred. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // If we have a result, show the report view
  if (analysisResult) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '42rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>Instant Report</h2>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem', spaceY: '1rem' }}>
                <p><strong>Feedback:</strong> {analysisResult.feedback}</p>
                <div style={{ marginTop: '1rem' }}><strong>Improvements:</strong>
                    <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', marginLeft: '1rem', color: '#059669' }}>
                        {analysisResult.improvements.map((item, i) => <li key={i}>{item.point ? <strong>{item.point}:</strong> : null} {item.explanation || item}</li>)}
                    </ul>
                </div>
                <div style={{ marginTop: '1rem' }}><strong>Mistakes:</strong>
                    <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', marginLeft: '1rem', color: '#f97316' }}>
                        {analysisResult.mistakes.filter(m => m.point || m).map((item, i) => <li key={i}>{item.point ? <strong>{item.point}:</strong> : null} {item.explanation || item}</li>)}
                    </ul>
                </div>
                {analysisResult.audioURL && (
                    <div style={{ marginTop: '1rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Listen to your recording:</strong>
                        <audio controls src={analysisResult.audioURL} style={{ width: '100%' }}></audio>
                    </div>
                )}
            </div>
            <button onClick={onClose} className="practice-button" style={{ marginTop: '1.5rem' }}>
                Done
            </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the recording view
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>New Practice Session</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', lineHeight: '1', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '1rem', minHeight: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: '500', color: '#374151' }}>
            {isAnalyzing && <Spinner />}
            <span>{status}</span>
          </div>
          {error && <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
          <button onClick={handleStartRecording} disabled={isRecording || isAnalyzing} style={{ backgroundColor: '#22c55e', color: 'white', fontWeight: '700', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', opacity: (isRecording || isAnalyzing) ? 0.5 : 1 }}>
            Start Recording
          </button>
          <button onClick={handleStopRecording} disabled={!isRecording || !canStop || isAnalyzing} style={{ backgroundColor: '#ef4444', color: 'white', fontWeight: '700', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: !isRecording || !canStop || isAnalyzing ? 'not-allowed' : 'pointer', opacity: (!isRecording || !canStop || isAnalyzing) ? 0.5 : 1 }}>
            Stop Recording
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeModal;