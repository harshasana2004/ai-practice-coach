import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const MIN_RECORDING_TIME_MS = 3000;

const Spinner = () => ( <svg style={{ animation: 'spin 1s linear infinite', marginRight: '0.75rem', height: '1.25rem', width: '1.25rem', color: '#4f46e5' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );

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

  useEffect(() => { return () => clearTimeout(stopTimerRef.current); }, []);

  const handleStartRecording = async () => {
    setError(""); setCanStop(false); setAnalysisResult(null);
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
      stopTimerRef.current = setTimeout(() => { setCanStop(true); setStatus("Recording... You can stop now."); }, MIN_RECORDING_TIME_MS);
    } catch (err) { setError("Could not access microphone. Please check browser permissions."); }
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
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      const payload = { data: [base64Audio] };
      try {
        const response = await fetch(BACKEND_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) { throw new Error(result.error || "An unknown server error occurred."); }
        const analysisData = result.data[0];
        setAnalysisResult(analysisData);
        onAnalysisComplete(analysisData);
      } catch (err) {
        setError(`Analysis failed: ${err.message}`);
        setStatus("An error occurred. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    };
  };

  if (analysisResult) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '42rem' }}>
            <h2 className="title" style={{ marginBottom: '1rem' }}>Instant Report</h2>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
                <div className="report-card" style={{padding:0, border: 'none'}}>
                    <p><strong>Feedback:</strong> {analysisResult.feedback}</p>
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Improvements:</h3>
                        <ul>{analysisResult.improvements.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Mistakes:</h3>
                        <ul>{analysisResult.mistakes.filter(m => m).map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                    {analysisResult.audioURL && (
                        <div style={{ marginTop: '1rem' }}>
                            <strong>Listen to your recording:</strong>
                            <audio controls src={analysisResult.audioURL} style={{ width: '100%', marginTop: '0.5rem' }}></audio>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={onClose} className="practice-button" style={{ marginTop: '1.5rem' }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="title">New Practice Session</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', lineHeight: '1', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
        </div>
        <div style={{ textAlign: 'center', paddingTop: '1rem', minHeight: '80px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: '500' }}>
            {isAnalyzing && <Spinner />}
            <span>{status}</span>
          </div>
          {error && <p style={{ color: '#ef4444', fontWeight: '600', marginTop: '0.5rem' }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
          <button onClick={handleStartRecording} disabled={isRecording || isAnalyzing} className="modal-button" style={{ backgroundColor: '#22c55e', color: 'white' }}>Start Recording</button>
          <button onClick={handleStopRecording} disabled={!isRecording || !canStop || isAnalyzing} className="modal-button" style={{ backgroundColor: '#ef4444', color: 'white' }}>Stop Recording</button>
        </div>
      </div>
    </div>
  );
};
export default PracticeModal;