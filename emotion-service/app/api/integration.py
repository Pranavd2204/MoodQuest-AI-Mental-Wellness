from fastapi import APIRouter, File, HTTPException, UploadFile
import cv2
import numpy as np

from app.services import emotion_detector

router = APIRouter(prefix="/integration", tags=["MoodQuest Integration"])
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

@router.post("/analyze")
async def analyze_for_moodquest(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Image must be JPEG, PNG or WebP")
    raw = await image.read()
    if not raw or len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image is empty or exceeds 5 MB")
    frame = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")
    result = emotion_detector.process_frame(frame)
    detections = result.get("all_detections", [])
    weights = {}
    for item in detections:
        label = str(item["emotion"]).lower()
        weights[label] = weights.get(label, 0.0) + float(item["confidence"])
    total = sum(weights.values())
    distribution = [
        {"emotion": label, "probability": round(weight / total, 4)}
        for label, weight in sorted(weights.items(), key=lambda pair: pair[1], reverse=True)
    ] if total else []
    return {
        "timestamp": result["timestamp"],
        "face_detected": result["face_detected"],
        "dominant_emotion": result["emotion"],
        "confidence": result["confidence"],
        "bbox": result["bbox"],
        "num_faces": result["num_faces"],
        "emotions": distribution,
        "provider": "YOLO11n",
    }
