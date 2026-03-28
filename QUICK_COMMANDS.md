# Quick Command Reference

## Run Everything (Copy & Paste)

### Terminal 1: Backend
```bash
cd "C:\Users\harsh\OneDrive\Desktop\Major Project\React\backend"
python app.py
```

### Terminal 2: Frontend
```bash
cd "C:\Users\harsh\OneDrive\Desktop\Major Project\React\frontend"
npm run dev
```

### Then Open Browser
```
http://localhost:5173
```

---

## Common Commands

### Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install --legacy-peer-deps
```

### Check if Everything Works
```bash
# Check backend
curl http://127.0.0.1:5000/

# Check frontend (after npm run dev)
# Visit http://localhost:5173 in browser
```

### Troubleshooting

```bash
# Reinstall Python packages
pip install --upgrade -r requirements.txt

# Clear npm and reinstall
cd frontend
rm -r node_modules package-lock.json
npm install --legacy-peer-deps

# Check Python versions
python --version  # Should be 3.8+
pip --version

# Check Node versions
node --version  # Should be 16+
npm --version
```

---

## Files Summary

| File | Status | Purpose |
|------|--------|---------|
| backend/app.py | ✅ UPDATED | Flask + WebSocket + facial endpoints |
| backend/facial_metrics.py | ✅ NEW | Facial analysis engine |
| backend/requirements.txt | ✅ UPDATED | Python dependencies |
| frontend/package.json | ✅ FIXED | Node dependencies (mediapipe fixed) |
| frontend/src/components/FaceDetectionCamera.jsx | ✅ UPDATED | Face detection component |
| frontend/src/components/FaceDetectionCamera.css | ✅ NEW | Camera styling |
| frontend/src/components/FacialAnalysisReport.jsx | ✅ NEW | Report display |
| frontend/src/components/FacialAnalysisReport.css | ✅ NEW | Report styling |
| frontend/src/components/PracticeModal.jsx | ✅ FIXED | Video mode + duplicate code removed |

---

## URLs When Running

| Service | URL |
|---------|-----|
| Backend | http://127.0.0.1:5000 |
| Frontend | http://localhost:5173 |
| Backend Health Check | http://127.0.0.1:5000/ |

---

## Features to Test

1. ✅ Audio-only mode (existing)
2. ✅ Video + AI Coach mode (NEW)
3. ✅ Real-time metrics
4. ✅ Facial analysis
5. ✅ AI feedback
6. ✅ Session history

---

Ready to go! 🚀

