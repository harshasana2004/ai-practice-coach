import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// This URL is now read from your Vercel environment variables
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
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result;

      const payload = {
        data: [
          base64Audio
        ]
      };

      try {
        const response = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "An unknown server error occurred.");
        }

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

  // If we have a result, show the report view
  if (analysisResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instant Report</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                <p><strong>Feedback:</strong> {analysisResult.feedback}</p>
                <div><strong>Improvements:</strong>
                    <ul className="list-disc list-inside ml-4 text-green-700">
                        {analysisResult.improvements.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <div><strong>Mistakes:</strong>
                    <ul className="list-disc list-inside ml-4 text-orange-700">
                        {analysisResult.mistakes.filter(m => m).map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                {analysisResult.audioURL && (
                    <div className="mt-4">
                        <strong className="block mb-2">Listen to your recording:</strong>
                        <audio controls src={analysisResult.audioURL} className="w-full"></audio>
                    </div>
                )}
            </div>
            <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition">
                Done
            </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the recording view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 space-y-6 w-full max-w-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">New Practice Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>

        <div className="text-center space-y-4 pt-4 min-h-[80px]">
          <div className="flex items-center justify-center text-lg font-medium text-gray-700">
            {isAnalyzing && <Spinner />}
            <span>{status}</span>
          </div>
          {error && <p className="text-red-500 font-semibold">{error}</p>}
        </div>

        <div className="flex items-center justify-center space-x-4 border-t pt-6">
          <button onClick={handleStartRecording} disabled={isRecording || isAnalyzing} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition">
            Start Recording
          </button>
          <button onClick={handleStopRecording} disabled={!isRecording || !canStop || isAnalyzing} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
            Stop Recording
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeModal;

