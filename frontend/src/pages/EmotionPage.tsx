import { Camera, CameraOff, ChartSpline, Cpu, ScanFace, Settings, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState, InlineError } from "@/components/ui/States";
import { useToast } from "@/contexts/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { useCamera } from "@/hooks/useCamera";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { emotionService } from "@/services/emotionService";
import type { EmotionAnalysis } from "@/types";

const EMOTIONS = ["angry", "contempt", "disgust", "fear", "happy", "natural", "sad", "sleepy", "surprised"];
const ANALYSIS_INTERVAL_MS = 1500;

function FaceFrame({ active, detected }: { active: boolean; detected: boolean }) {
  const corner = cn("absolute size-10 border-[3px] transition-colors", active && detected ? "border-emerald-400" : "border-white/30");
  return <div className="pointer-events-none absolute inset-[14%_16%]" aria-hidden>
    <span className={cn(corner, "top-0 left-0 rounded-tl-2xl border-r-0 border-b-0")} />
    <span className={cn(corner, "top-0 right-0 rounded-tr-2xl border-b-0 border-l-0")} />
    <span className={cn(corner, "bottom-0 left-0 rounded-bl-2xl border-t-0 border-r-0")} />
    <span className={cn(corner, "right-0 bottom-0 rounded-br-2xl border-t-0 border-l-0")} />
  </div>;
}

export function EmotionPage() {
  const toast = useToast();
  const camera = useCamera();
  const status = useAsync(() => emotionService.getStatus(), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [latest, setLatest] = useState<EmotionAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<{ emotion: string; time: string }[]>([]);
  const inFlight = useRef(false);
  const lastSavedMood = useRef<string | null>(null);

  const active = camera.status === "active";
  const modelAvailable = status.data?.available ?? false;

  useEffect(() => {
    if (!active || !modelAvailable) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const analyze = async () => {
      if (cancelled || inFlight.current) return;
      inFlight.current = true;
      setAnalyzing(true);
      try {
        const frame = await camera.captureFrame();
        if (!frame) throw new Error("Camera frame is not ready yet.");
        const result = await emotionService.analyzeFrame(frame);
        if (!cancelled) {
          setLatest(result);
          setAnalysisError(null);
          if (result.face_detected && result.dominant_emotion) {
            setHistory((previous) => [...previous.slice(-19), { emotion: result.dominant_emotion!, time: new Date().toLocaleTimeString() }]);
          }
          if (result.saved_mood && result.saved_mood !== lastSavedMood.current) {
            lastSavedMood.current = result.saved_mood;
            toast.success(`Camera observation saved to mood history as ${result.saved_mood}.`);
          }
        }
      } catch (error) {
        if (!cancelled) setAnalysisError(getErrorMessage(error, error instanceof Error ? error.message : "Emotion analysis failed."));
      } finally {
        inFlight.current = false;
        if (!cancelled) setAnalyzing(false);
        if (!cancelled) timer = setTimeout(analyze, ANALYSIS_INTERVAL_MS);
      }
    };
    void analyze();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [active, modelAvailable, camera.captureFrame, toast]);


  const confidencePercent = Math.round((latest?.confidence ?? 0) * 100);
  const probabilities = new Map((latest?.emotions ?? []).map((item) => [item.emotion.toLowerCase(), item.probability]));

  return <div className="space-y-4">
    <PageHeader title="Emotion Detection" actions={<IconButton label="Camera settings" onClick={() => setSettingsOpen(true)}><Settings className="size-4.5" /></IconButton>} />

    <div className="flex items-start gap-3 rounded-2xl border border-sky-400/25 bg-sky-500/10 p-3 text-sm text-sky-100">
      <Cpu className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p><strong className="font-semibold">{modelAvailable ? "YOLO11n connected." : "Model service unavailable."}</strong>{" "}
        {status.data?.message ?? "Start the Python emotion service and refresh this page."}{" "}
        Facial expressions are estimates, not a diagnosis or proof of how someone feels.
      </p>
    </div>

    <div className="grid grid-cols-[1.4fr_1fr] gap-3 sm:gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="glass relative aspect-[3/4] overflow-hidden p-0 sm:aspect-[4/3]">
        <video ref={camera.videoRef} playsInline muted className={cn("absolute inset-0 size-full -scale-x-100 object-cover", !active && "hidden")} />
        {!active && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          {camera.status === "starting" ? <p className="text-sm text-slate-300">Requesting camera access…</p> : <>
            <span className="flex size-14 items-center justify-center rounded-full bg-white/5 text-slate-400"><CameraOff className="size-6" aria-hidden /></span>
            <p className="text-sm text-slate-400">Camera is off</p>
          </>}
        </div>}
        <FaceFrame active={active} detected={latest?.face_detected ?? false} />
        {active && <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white">
          <span className="size-2 animate-pulse rounded-full bg-rose-500" aria-hidden /> {analyzing ? "Analyzing" : "Live analysis"}
        </span>}
      </div>

      <div className="glass flex flex-col gap-1 p-2.5 sm:p-3" aria-label="Emotion probabilities">
        {EMOTIONS.map((emotion) => {
          const value = Math.round((probabilities.get(emotion) ?? 0) * 100);
          return <div key={emotion} className="space-y-1 rounded-xl px-2 py-1.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between"><span className="capitalize text-slate-300">{emotion}</span><span className="text-slate-400 tabular-nums">{latest?.face_detected ? `${value}%` : "—"}</span></div>
            <ProgressBar value={value} />
          </div>;
        })}
      </div>
    </div>

    <Card>
      <p className="text-xs text-slate-400">Observed facial expression</p>
      <div className="mt-1 flex items-center gap-3">
        <ScanFace className="size-9 text-slate-400" aria-hidden />
        <p className="flex-1 text-lg font-semibold capitalize text-white">{latest?.face_detected ? latest.dominant_emotion : active ? "No face detected" : "Waiting for camera"}</p>
        <span className="text-2xl font-bold text-slate-200">{latest?.face_detected ? `${confidencePercent}%` : "—"}</span>
      </div>
      <ProgressBar value={confidencePercent} className="mt-3" label="Model confidence" />
      <p className="mt-2 text-xs text-slate-500">{latest?.face_detected ? `${latest.num_faces} face(s) detected · ${latest.provider}` : "The service analyzes a frame approximately every 1.5 seconds while the camera is on."}</p>
      {latest?.saved_mood && <p className="mt-2 text-xs text-emerald-300">Saved to mood history: {latest.saved_mood}</p>}
      {analysisError && <p className="mt-2 text-xs text-amber-300">{analysisError}</p>}
    </Card>

    <Card>
      <p className="mb-1 text-sm font-semibold text-white">Recent observations</p>
      {history.length ? <div className="flex flex-wrap gap-2">{history.slice(-8).reverse().map((item, index) =>
        <span key={`${item.time}-${index}`} className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs capitalize text-slate-200">{item.emotion} · {item.time}</span>)}</div> :
        <EmptyState compact icon={ChartSpline} title="No observations yet" message="Start the camera to see recent facial-expression observations." />}
    </Card>

    <InlineError message={camera.error} />
    {active ? <Button variant="danger" size="lg" fullWidth icon={<Video className="size-5" />} onClick={camera.stop}>Stop Camera</Button> :
      <Button size="lg" fullWidth icon={<Camera className="size-5" />} onClick={() => void camera.start()} loading={camera.status === "starting"} disabled={!modelAvailable}>
        {camera.status === "error" ? "Try Camera Again" : "Start Real-Time Detection"}
      </Button>}

    <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Camera settings">
      {camera.devices.length > 0 ? <SelectField label="Camera" value={camera.deviceId ?? ""} onChange={(e) => { void camera.start(e.target.value); setSettingsOpen(false); }}>
        {camera.devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}
      </SelectField> : <p className="text-sm text-slate-400">Start the camera once to choose between available cameras.</p>}
      <p className="mt-4 text-xs text-slate-500">Camera frames are sent to your MoodQuest backend for YOLO11n analysis while detection is running. Stop the camera to end analysis. Only periodic mood observations are saved, not video recordings.</p>
    </Modal>
  </div>;
}
