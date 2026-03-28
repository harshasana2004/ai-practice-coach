import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import './FaceDetectionCamera.css';

const FaceDetectionCamera = ({ onMetricsUpdate, sessionId, isRecording = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const animationIdRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [metrics, setMetrics] = useState({
    engagement: 0,
    confidence: 0,
    eyeContact: 0
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const frameCountRef = useRef(0);
  const lastEmitRef = useRef(0);

  // Initialize face detection model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        await tf.ready();
        const model = await blazeface.load();
        modelRef.current = model;
        console.log('BlazeFace model loaded successfully');
        setIsInitializing(false);
      } catch (err) {
        console.error('Error loading face detection model:', err);
        setError('Failed to load face detection model. Please refresh the page.');
        setIsInitializing(false);
      }
    };

    initializeModel();

    return () => {
      if (modelRef.current) {
        modelRef.current.dispose?.();
      }
    };
  }, []);

  // Initialize video stream
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            startDetection();
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    if (!isInitializing && modelRef.current) {
      startVideo();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isInitializing]);

  const startDetection = () => {
    const detect = async () => {
      if (!videoRef.current || !canvasRef.current || !modelRef.current) {
        animationIdRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Detect faces
        const predictions = await modelRef.current.estimateFaces(video, false);

        if (predictions && predictions.length > 0) {
          setFaceDetected(true);

          // Draw face boxes
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const face = predictions[0];
          drawFaceBox(ctx, face, canvas.width, canvas.height);

          // Calculate metrics every 5 frames
          frameCountRef.current++;
          if (frameCountRef.current % 5 === 0 && isRecording) {
            const currentTime = Date.now();
            if (currentTime - lastEmitRef.current > 500) {
              const newMetrics = calculateMetrics(face, canvas.width, canvas.height);
              setMetrics(newMetrics);

              if (onMetricsUpdate) {
                onMetricsUpdate({
                  ...newMetrics,
                  timestamp: new Date().toISOString(),
                  faceDetected: true
                });
              }

              lastEmitRef.current = currentTime;
            }
          }
        } else {
          setFaceDetected(false);
          setMetrics({ engagement: 0, confidence: 0, eyeContact: 0 });
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.error('Error during face detection:', err);
      }

      animationIdRef.current = requestAnimationFrame(detect);
    };

    animationIdRef.current = requestAnimationFrame(detect);
  };

  const calculateMetrics = (face, width, height) => {
    try {
      // Validate face object - BlazeFace returns topLeft and bottomRight
      if (!face || !face.topLeft || !face.bottomRight) {
        return { engagement: 0, confidence: 0, eyeContact: 0 };
      }

      const [sx, sy] = face.topLeft;
      const [ex, ey] = face.bottomRight;

      // Ensure coordinates are valid
      if (!Number.isFinite(sx) || !Number.isFinite(sy) ||
          !Number.isFinite(ex) || !Number.isFinite(ey)) {
        return { engagement: 0, confidence: 0, eyeContact: 0 };
      }

      const faceWidth = (ex - sx) / width;
      const faceHeight = (ey - sy) / height;
      const faceSize = (faceWidth + faceHeight) / 2;

      const engagement = Math.min(100, Math.max(20, faceSize * 200));

      const faceCenterX = (sx + ex) / 2 / width;
      const faceCenterY = (sy + ey) / 2 / height;

      const distFromCenter = Math.sqrt(
        Math.pow(faceCenterX - 0.5, 2) +
        Math.pow(faceCenterY - 0.5, 2)
      );

      const eyeContact = Math.max(0, 100 - (distFromCenter * 150));
      const confidence = (engagement * 0.6 + eyeContact * 0.4);

      return {
        engagement: Math.round(Math.min(100, Math.max(0, engagement))),
        confidence: Math.round(Math.min(100, Math.max(0, confidence))),
        eyeContact: Math.round(Math.min(100, Math.max(0, eyeContact)))
      };
    } catch (err) {
      console.error('Error calculating metrics:', err);
      return { engagement: 0, confidence: 0, eyeContact: 0 };
    }
  };

  const drawFaceBox = (ctx, face, width, height) => {
    // Validate face object has required properties - BlazeFace returns topLeft and bottomRight
    if (!face || !face.topLeft || !face.bottomRight) {
      console.warn('Invalid face object:', face);
      return;
    }

    const [sx, sy] = face.topLeft;
    const [ex, ey] = face.bottomRight;

    // Ensure coordinates are valid numbers
    if (!Number.isFinite(sx) || !Number.isFinite(sy) ||
        !Number.isFinite(ex) || !Number.isFinite(ey)) {
      console.warn('Invalid face coordinates');
      return;
    }

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, ex - sx, ey - sy);

    ctx.fillStyle = '#00FF00';
    ctx.font = '16px Arial';
    ctx.fillText('Face Detected', sx + 5, sy - 5);
  };

  return (
    <div className="face-detection-container">
      <div className="camera-wrapper">
        <video
          ref={videoRef}
          className="video-feed"
          style={{ display: 'none' }}
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="detection-canvas"
          title="Face Detection - Green box shows detected face"
        />

        {isInitializing && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Initializing face detection...</p>
          </div>
        )}

        {error && (
          <div className="error-overlay">
            <p>{error}</p>
          </div>
        )}

        {!faceDetected && !isInitializing && !error && (
          <div className="face-detection-hint">
            <p>📹 Position your face in the frame</p>
          </div>
        )}
      </div>

      <div className="metrics-display">
        <div className="metric-item">
          <div className="metric-label">Engagement</div>
          <div className="metric-bar">
            <div
              className="metric-fill engagement"
              style={{ width: `${metrics.engagement}%` }}
            ></div>
          </div>
          <div className="metric-value">{metrics.engagement}%</div>
        </div>

        <div className="metric-item">
          <div className="metric-label">Confidence</div>
          <div className="metric-bar">
            <div
              className="metric-fill confidence"
              style={{ width: `${metrics.confidence}%` }}
            ></div>
          </div>
          <div className="metric-value">{metrics.confidence}%</div>
        </div>

        <div className="metric-item">
          <div className="metric-label">Eye Contact</div>
          <div className="metric-bar">
            <div
              className="metric-fill eyecontact"
              style={{ width: `${metrics.eyeContact}%` }}
            ></div>
          </div>
          <div className="metric-value">{metrics.eyeContact}%</div>
        </div>

        <div className="status-badge">
          <span className={`status ${faceDetected ? 'detected' : 'not-detected'}`}>
            {faceDetected ? '✓ Face Detected' : '✗ No Face Detected'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FaceDetectionCamera;



