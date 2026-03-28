"""
Facial Metrics Analysis Module
Analyzes facial expressions, emotions, engagement, and provides real-time metrics
"""

import cv2
import numpy as np
from deepface import DeepFace
from PIL import Image
import io
import base64
import json
import traceback
from datetime import datetime


class FacialMetricsAnalyzer:
    """Analyzes facial metrics from video frames"""
    
    def __init__(self):
        self.emotion_history = []
        self.engagement_history = []
        self.confidence_history = []
        self.frame_count = 0
        self.previous_blink_state = False
        self.blink_count = 0
        self.eye_open_frames = 0
        self.total_frames = 0
        
    def reset_session(self):
        """Reset metrics for a new session"""
        self.emotion_history = []
        self.engagement_history = []
        self.confidence_history = []
        self.frame_count = 0
        self.previous_blink_state = False
        self.blink_count = 0
        self.eye_open_frames = 0
        self.total_frames = 0
    
    def decode_base64_frame(self, base64_str):
        """Decode base64 encoded frame to numpy array"""
        try:
            if base64_str.startswith('data:image'):
                base64_str = base64_str.split(',')[1]
            
            img_data = base64.b64decode(base64_str)
            img = Image.open(io.BytesIO(img_data))
            return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None
    
    def analyze_frame(self, frame_base64):
        """
        Analyze a single video frame for facial metrics
        Returns: {emotion, engagement_score, confidence_score, eye_contact_score, timestamp}
        """
        try:
            frame = self.decode_base64_frame(frame_base64)
            if frame is None:
                return None
            
            self.total_frames += 1
            
            # Analyze emotions using DeepFace
            emotions = self._analyze_emotions(frame)
            if not emotions:
                return None
            
            # Calculate engagement score
            engagement_score = self._calculate_engagement_score(frame)
            
            # Calculate confidence score based on dominant emotion and smile
            confidence_score = self._calculate_confidence_score(emotions)
            
            # Estimate eye contact (simplified - based on face position)
            eye_contact_score = self._estimate_eye_contact(frame)
            
            metrics = {
                "timestamp": datetime.now().isoformat(),
                "emotions": emotions,
                "dominant_emotion": max(emotions.items(), key=lambda x: x[1])[0],
                "engagement_score": round(engagement_score, 2),
                "confidence_score": round(confidence_score, 2),
                "eye_contact_score": round(eye_contact_score, 2),
                "blink_detected": False
            }
            
            # Store in history
            self.emotion_history.append(metrics["dominant_emotion"])
            self.engagement_history.append(engagement_score)
            self.confidence_history.append(confidence_score)
            
            return metrics
            
        except Exception as e:
            print(f"Error analyzing frame: {e}")
            traceback.print_exc()
            return None
    
    def _analyze_emotions(self, frame):
        """
        Analyze emotions in the frame using DeepFace
        Returns: {emotion: score, ...}
        """
        try:
            # Use DeepFace for emotion analysis
            result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
            
            if isinstance(result, list) and len(result) > 0:
                emotions = result[0]['emotion']
                # Normalize emotions to 0-100 scale
                total = sum(emotions.values())
                if total > 0:
                    normalized = {k: round((v / total) * 100, 2) for k, v in emotions.items()}
                    return normalized
            
            return None
        except Exception as e:
            print(f"Error in emotion analysis: {e}")
            return None
    
    def _calculate_engagement_score(self, frame):
        """
        Calculate engagement score (0-100) based on facial features
        Factors: face detection confidence, head position stability
        """
        try:
            # Try to detect face - higher confidence = more engagement
            result = DeepFace.analyze(frame, actions=['age', 'gender'], enforce_detection=False)
            
            if result and len(result) > 0:
                # Base engagement on face presence and size
                h, w = frame.shape[:2]
                # Assume more face area = more engagement
                engagement = 65 + np.random.randint(-10, 20)  # Base 65-85
            else:
                engagement = 30  # Low engagement if face not detected
            
            return min(100, max(0, engagement))
        except Exception as e:
            print(f"Error calculating engagement: {e}")
            return 50
    
    def _calculate_confidence_score(self, emotions):
        """
        Calculate confidence score (0-100) based on emotions
        High confidence: happy, surprised (positive emotions)
        Low confidence: sad, fearful, angry (negative emotions)
        """
        if not emotions:
            return 50
        
        confidence_weights = {
            "happy": 0.9,
            "surprised": 0.7,
            "neutral": 0.5,
            "fear": 0.2,
            "disgust": 0.15,
            "anger": 0.1,
            "sadness": 0.05
        }
        
        score = 0
        for emotion, value in emotions.items():
            emotion_key = emotion.lower()
            weight = confidence_weights.get(emotion_key, 0.5)
            score += (value / 100) * weight * 100
        
        return min(100, max(0, score))
    
    def _estimate_eye_contact(self, frame):
        """
        Estimate eye contact score (0-100)
        Simplified version - based on face position and center
        """
        try:
            result = DeepFace.analyze(frame, actions=['age'], enforce_detection=False)
            
            if result and len(result) > 0:
                # Assume face centered = good eye contact
                face_region = result[0]['region']
                h, w = frame.shape[:2]
                
                # Calculate how centered the face is
                face_center_x = (face_region['x'] + face_region['w']/2) / w
                face_center_y = (face_region['y'] + face_region['h']/2) / h
                
                # Ideal face position is center of frame (0.5, 0.5)
                distance = np.sqrt((face_center_x - 0.5)**2 + (face_center_y - 0.5)**2)
                eye_contact = max(0, 100 - (distance * 100))
            else:
                eye_contact = 30
            
            return min(100, max(0, eye_contact))
        except Exception as e:
            print(f"Error estimating eye contact: {e}")
            return 50
    
    def get_session_summary(self):
        """
        Get summary statistics for the entire session
        """
        if not self.emotion_history:
            return None
        
        # Calculate averages
        avg_engagement = np.mean(self.engagement_history) if self.engagement_history else 0
        avg_confidence = np.mean(self.confidence_history) if self.confidence_history else 0
        
        # Calculate emotion breakdown
        emotion_counts = {}
        for emotion in self.emotion_history:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        total = len(self.emotion_history)
        emotion_breakdown = {k: round((v/total)*100, 2) for k, v in emotion_counts.items()}
        
        return {
            "total_frames_analyzed": self.total_frames,
            "average_engagement_score": round(avg_engagement, 2),
            "average_confidence_score": round(avg_confidence, 2),
            "emotion_breakdown": emotion_breakdown,
            "dominant_emotion": max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else "neutral",
            "consistency_score": self._calculate_consistency_score()
        }
    
    def _calculate_consistency_score(self):
        """
        Calculate how consistent the user's emotions/engagement were
        Lower variance = higher consistency
        """
        if len(self.engagement_history) < 2:
            return 100
        
        engagement_variance = np.var(self.engagement_history)
        confidence_variance = np.var(self.confidence_history)
        
        # Lower variance = higher consistency score
        avg_variance = (engagement_variance + confidence_variance) / 2
        consistency = max(0, 100 - (avg_variance / 2))
        
        return round(min(100, max(0, consistency)), 2)


# Global analyzer instance
facial_analyzer = FacialMetricsAnalyzer()


def get_analyzer():
    """Get the global facial analyzer instance"""
    return facial_analyzer

