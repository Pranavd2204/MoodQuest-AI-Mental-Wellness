# MoodQuest + YOLO11n real-time integration

This project combines the uploaded MoodQuest application with the uploaded YOLO11n facial-expression detector. The React application and Node/Express API remain the user-facing application; YOLO11n runs as a separate internal Python inference service.

## Architecture and request flow

```text
Browser webcam
  └─ still frame every ~1.5 seconds (while user has enabled detection)
       ↓ authenticated multipart request
MoodQuest Node API: POST /api/emotion/analyze
       ↓ private server-to-server multipart request
YOLO11n FastAPI: POST /integration/analyze
       ↓
YOLO11n model → prediction JSON
       ↓
Node response → live React UI
       └─ optional periodic MoodLog (source=camera)
```

The browser does not call the Python service directly. MoodQuest's existing JWT-protected endpoint validates the image and proxies it to Python. No video is recorded. The backend stores at most one camera-derived mood log per user in any 30-second window, and only when a face is detected with model confidence of at least 0.50.

### Expression-to-MoodQuest mapping

| YOLO11n expression | MoodQuest mood |
|---|---|
| happy | happy |
| natural, sleepy | calm |
| sad | sad |
| angry | angry |
| fear, surprised | anxious |
| disgust, contempt | stressed |

This mapping is a coarse product signal, not a clinical interpretation. Facial expressions do not reliably establish someone's internal emotional state. Manual check-ins remain available.

## Prerequisites

- Node.js 20.19 or newer
- PostgreSQL configured as described in the main MoodQuest README
- Python 3.10 or 3.11 recommended for the supplied PyTorch/Ultralytics stack
- Webcam and browser camera permission
- `emotion-service/models/best.pt` (the supplied trained weights)

## 1. Configure and start MoodQuest backend

From the `backend/` directory, copy `.env.example` to `.env` and fill in your existing database URL and JWT secret. Add/keep:

```env
EMOTION_SERVICE_URL=http://127.0.0.1:8001
```

Then run:

```bash
npm install
npm run db:migrate
npm run dev
```

The MoodQuest API uses port `4000` by default. Keep this terminal running.

## 2. Install and start the YOLO11n service

Open a second terminal in `emotion-service/`:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Linux/macOS:

```bash
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

The uploaded model is loaded once when the Python process starts. The first startup can take a while. CPU inference is supported but may be slower. If you need a CUDA-specific PyTorch build, install the matching build for your OS/CUDA version using the official PyTorch installation selector before installing the remaining requirements.

Check the Python service:

- `http://127.0.0.1:8001/health` — should report `model_loaded: true`.
- `http://127.0.0.1:8001/docs` — API documentation, including `/integration/analyze`.

## 3. Start MoodQuest frontend

Open a third terminal in `frontend/`:

```bash
npm install
```

Copy `.env.example` to `.env` if you have not already, then run:

```bash
npm run dev
```

Open the Vite URL, sign in, navigate to **Emotion Detection**, and select **Start Real-Time Detection**. Grant camera permission. The screen should update with the latest observed expression, confidence, and class probability bars. Select **Stop Camera** to end capture and analysis.

## 4. Verify end-to-end

1. Python `/health` reports `model_loaded: true`.
2. MoodQuest backend `/health` reports database `ok`.
3. Sign in to MoodQuest and open Emotion Detection.
4. Start the camera and confirm the observed expression updates approximately every 1.5 seconds.
5. Check the Progress/mood history for records with `source = camera`. The first qualifying observation is saved; all further camera writes are throttled to one per 30 seconds, even if the predicted expression changes.

## File-by-file changes

### Added

- `emotion-service/app/api/integration.py` — accepts a still image, decodes it with OpenCV, runs the existing YOLO detector and returns a stable JSON payload.
- `INTEGRATION-YOLO11N.md` — this setup and architecture guide.

### Modified Python service

- `emotion-service/app/api/__init__.py` — exports the integration router.
- `emotion-service/app/main.py` — registers `/integration/analyze`.
- `emotion-service/app/config.py` — changes the default Python API port to `8001`.
- `emotion-service/requirements.txt` — adds `python-multipart` for image uploads.

### Modified MoodQuest backend

- `backend/src/config/env.ts` — adds `EMOTION_SERVICE_URL` with default `http://127.0.0.1:8001`.
- `backend/.env.example` — documents the Python service URL.
- `backend/src/services/emotion.service.ts` — checks Python health and forwards uploaded frames to YOLO11n.
- `backend/src/controllers/system.controller.ts` — returns real model status, proxies inference, maps expression labels to existing moods, and stores throttled `source=camera` MoodLog records.

### Modified MoodQuest frontend

- `frontend/src/types/index.ts` — adds the typed prediction response.
- `frontend/src/services/emotionService.ts` — uses typed status and frame-analysis requests.
- `frontend/src/pages/EmotionPage.tsx` — captures frames automatically every ~1.5 seconds, prevents overlapping requests, shows the current prediction and probability bars, and displays recent observations.

## Important deployment and privacy notes

- Do not expose Python port `8001` publicly. Keep it bound to localhost/private network; add service-to-service authentication before deploying across hosts.
- Use HTTPS in production. Browser camera access generally requires a secure context (localhost is allowed for development).
- Real-time mode sends still frames, not a continuous video recording. Frames are processed by the Python service and not saved by this integration.
- To reduce inference load on a slower computer, increase `ANALYSIS_INTERVAL_MS` in `frontend/src/pages/EmotionPage.tsx`.
- Camera predictions are stored as mood-history signals and can inform MoodQuest's existing mood-aware content. This patch does not inject facial predictions into the LLM chat prompt automatically.
- Keep camera detection opt-in, provide a visible stop control, and do not present predictions as diagnosis or certainty about a user's feelings.
