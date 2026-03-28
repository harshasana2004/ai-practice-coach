import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import prompts from '../prompts';

const BACKEND_URL = "http://127.0.0.1:5000/analyze";
const MIN_RECORDING_TIME_MS = 3000;

const Spinner = () => ( <svg style={{ animation: 'spin 1s linear infinite', marginRight: '0.75rem', height: '1.25rem', width: '1.25rem', color: '#4f46e5' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );

const PracticeModal = ({ onClose, onAnalysisComplete }) => {
  const [status, setStatus] = useState("Click 'Start Recording' or 'Get a Prompt'.");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [canStop, setCanStop] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const { user } = useAuth();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const stopTimerRef = useRef(null);

  useEffect(() => { return () => clearTimeout(stopTimerRef.current); }, []);

  const getNewPrompt = () => {
    setError("");
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);
    setStatus("Ready to record your response to the prompt!");
  };

  const handleStartRecording = async () => {
    setError(""); setCanStop(false); setAnalysisResult(null);
    setCurrentPrompt("");
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
      setStatus("Analyzing... This may take up to a minute.");
    }
  };

  const uploadAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    if (user) formData.append("uid", user.uid);

    try {
        setError("");
        const response = await fetch(BACKEND_URL, { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.error || "An unknown server error occurred."); }

        if (!data.analysis) {
             data.analysis = {
                 overallFeedback: data.feedback || "Analysis structure error.",
                 confidenceScore: data.confidenceScore || 50,
                 grammaticalErrors: [], clarityConciseness: [],
                 pacingAnalysis: { assessment: `${data.wpm} WPM`, recommendation: "" },
                 vocalVarietyAnalysis: { assessment: data.pitchModulation?.toFixed(1) || "N/A", recommendation: "" },
                 fillerWordAnalysis: [], pauseAnalysis: [],
                 keyImprovements: data.improvements ? data.improvements.map(imp => ({ area: "General", action: imp })) : []
             };
        }

        setAnalysisResult(data);
        onAnalysisComplete(data, null); // Pass null for categoryId
    } catch (err) {
        setError(`Analysis failed: ${err.message}`);
        setStatus("An error occurred. Please try again.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  if (analysisResult) {
    const analysis = analysisResult.analysis;
    return (
      <div className="modal-overlay">
        <div className="modal-content instant-report-modal">
          <div className="modal-header">
            <h2 className="title">Instant Report</h2>
            <button onClick={onClose} className="modal-close-button">&times;</button>
          </div>
          <div className="instant-report-content">
            <div className="instant-report-section">
              <h3>Overall Feedback</h3>
              <p>{analysis.overallFeedback}</p>
              <p style={{ marginTop: '0.75rem' }}><strong>Confidence Score:</strong> {analysis.confidenceScore}%</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div className="instant-report-section">
                  <h3>Pacing</h3>
                  <p><strong>Assessment:</strong> {analysis.pacingAnalysis?.assessment} ({analysisResult.wpm} WPM)</p>
                  <p><strong>Recommendation:</strong> {analysis.pacingAnalysis?.recommendation}</p>
               </div>
               <div className="instant-report-section">
                  <h3>Vocal Variety</h3>
                  <p><strong>Assessment:</strong> {analysis.vocalVarietyAnalysis?.assessment} (Score: {analysisResult.pitchModulation?.toFixed(1)})</p>
                  <p><strong>Recommendation:</strong> {analysis.vocalVarietyAnalysis?.recommendation}</p>
               </div>
            </div>
            <div className="instant-report-section">
              <h3 style={{ color: 'var(--warning-color)' }}>Detailed Analysis</h3>
              {analysis.fillerWordAnalysis?.length > 0 && (
                <div style={{marginBottom: '1rem'}}>
                  <strong>Filler Words Detected:</strong>
                  <ul>{analysis.fillerWordAnalysis.map((item, i) => ( <li key={i}> <strong>{item.word}:</strong> {item.count} time(s) </li> ))}</ul>
                </div>
              )}
              {analysis.pauseAnalysis?.length > 0 && (
                <div style={{marginBottom: '1rem'}}>
                  <strong>Pauses & Hesitations:</strong>
                  <ul>{analysis.pauseAnalysis.map((item, i) => ( <li key={i}> <strong>{item.type}:</strong> "{item.context}" </li> ))}</ul>
                </div>
              )}
              {analysis.clarityConciseness?.length > 0 && (
                <div style={{marginBottom: '1rem'}}>
                  <strong>Clarity Issues:</strong>
                  <ul>{analysis.clarityConciseness.map((item, i) => ( <li key={i}> <strong>{item.issue}:</strong> "{item.example}"<br /> <em>Suggestion:</em> {item.suggestion} </li> ))}</ul>
                </div>
              )}
              {analysis.grammaticalErrors?.length > 0 && (
                <div>
                  <strong>Grammatical Mistakes:</strong>
                  <ul>{analysis.grammaticalErrors.map((item, i) => ( <li key={i}> <strong>{item.error}:</strong> "{item.example}"<br /> <em>Correction:</em> {item.correction} </li> ))}</ul>
                </div>
              )}
              {analysis.fillerWordAnalysis?.length === 0 && analysis.pauseAnalysis?.length === 0 && analysis.clarityConciseness?.length === 0 && analysis.grammaticalErrors?.length === 0 && (
                <p>No significant mistakes or issues detected. Great job!</p>
              )}
            </div>
             {analysis.keyImprovements?.length > 0 && (
                <div className="instant-report-section">
                  <h3 style={{ color: 'var(--success-color)' }}>Key Improvements</h3>
                  <ul>
                    {analysis.keyImprovements.map((item, i) => (
                      <li key={i}>
                        {typeof item === 'string' ? item : (
                          <>{item.area ? <strong>{item.area}:</strong> : null} {item.action}</>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
            )}
            {analysisResult.audioURL && (
              <div className="instant-report-section">
                <h3 style={{ color: 'var(--purple-color)' }}>Your Recording</h3>
                <audio controls src={analysisResult.audioURL} style={{ width: '100%' }}></audio>
              </div>
            )}
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
             <button onClick={onClose} className="practice-button" style={{ marginTop: '1.5rem', width: 'auto', padding: '0.75rem 2rem' }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="title">New Practice Session</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>

        {currentPrompt && (
          <div className="modal-prompt-display">
            <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Your Prompt:</span>
            <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic', color: 'var(--text-primary)' }}>"{currentPrompt}"</p>
          </div>
        )}

        <div className="modal-status">
          <div className="modal-status-text">
            {isAnalyzing && <Spinner />}
            <span>{status}</span>
          </div>
          {error && <p className="modal-error-text">{error}</p>}
        </div>

        <div className="modal-buttons">
          <button onClick={getNewPrompt} disabled={isRecording || isAnalyzing} className="modal-button prompt-button">
            Get a Prompt
          </button>
          <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
            <button onClick={handleStartRecording} disabled={isRecording || isAnalyzing} className="modal-button start-button">Start Recording</button>
            <button onClick={handleStopRecording} disabled={!isRecording || !canStop || isAnalyzing} className="modal-button stop-button">Stop Recording</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeModal;