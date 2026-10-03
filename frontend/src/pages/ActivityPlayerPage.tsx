import { CheckCircle2, ExternalLink, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { CATEGORY_STYLE } from "@/components/media/ActivityRow";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { useToast } from "@/contexts/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { getErrorMessage } from "@/lib/api";
import { activityService } from "@/services/activityService";
import { formatDuration, timeAgo } from "@/utils/date";

export function ActivityPlayerPage() {
  const activityId = Number(useParams().activityId);
  const toast = useToast();
  const activity = useAsync(() => activityService.getActivity(activityId), [activityId]);
  const [pos, setPosState] = useState({ stepIndex: 0, remaining: 0 });
  const posRef = useRef(pos);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const initialisedFor = useRef<number | null>(null);

  const steps = activity.data?.steps ?? [];
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const { stepIndex, remaining } = pos;
  const step = steps[stepIndex];
  const totalSeconds = steps.reduce((sum, s) => sum + s.seconds, 0);
  const elapsedSeconds = steps.slice(0, stepIndex).reduce((sum, s) => sum + s.seconds, 0) + ((step?.seconds ?? 0) - remaining);

  const setPos = (next: { stepIndex: number; remaining: number }) => {
    posRef.current = next;
    setPosState(next);
  };

  useEffect(() => {
    const data = activity.data;
    if (!data || initialisedFor.current === data.id) return;
    initialisedFor.current = data.id;
    setPos({ stepIndex: 0, remaining: data.steps[0]?.seconds ?? 0 });
  }, [activity.data]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const all = stepsRef.current;
      const { stepIndex: index, remaining: left } = posRef.current;
      if (left > 1) {
        setPos({ stepIndex: index, remaining: left - 1 });
      } else if (index + 1 < all.length) {
        setPos({ stepIndex: index + 1, remaining: all[index + 1].seconds });
      } else {
        setPos({ stepIndex: index, remaining: 0 });
        setPlaying(false);
        setFinished(true);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  function restart() {
    setPos({ stepIndex: 0, remaining: steps[0]?.seconds ?? 0 });
    setFinished(false);
    setCompleted(false);
    setPlaying(true);
  }

  function skip() {
    if (stepIndex + 1 >= steps.length) {
      setPos({ stepIndex, remaining: 0 });
      setPlaying(false);
      setFinished(true);
    } else {
      setPos({ stepIndex: stepIndex + 1, remaining: steps[stepIndex + 1].seconds });
    }
  }

  async function markComplete() {
    setCompleting(true);
    try {
      await activityService.complete(activityId);
      setCompleted(true);
      toast.success("Nice work! Activity marked as completed.");
      void activity.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't save your progress. Please try again."));
    } finally {
      setCompleting(false);
    }
  }

  if (activity.loading && !activity.data) return <LoadingState label="Loading exercise…" />;
  if (activity.error || !activity.data) {
    return (
      <div>
        <PageHeader title="Meditation & Exercises" backTo="/meditation" />
        <ErrorState message={activity.error ?? "Exercise not found"} onRetry={activity.reload} />
      </div>
    );
  }

  const data = activity.data;
  const style = CATEGORY_STYLE[data.category] ?? CATEGORY_STYLE.mindfulness;
  const progress = totalSeconds ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
  const circumference = 2 * Math.PI * 88;

  return (
    <div className="space-y-5">
      <PageHeader title={data.title} subtitle={`${data.duration} min · ${data.benefit ?? data.category}`} backTo="/meditation" />

      <Card className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="relative size-56">
          <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="8" />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke={style.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 8px ${style.color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={playing ? "absolute size-28 animate-breathe rounded-full blur-2xl" : "absolute size-28 rounded-full opacity-40 blur-2xl"}
              style={{ background: style.color }}
              aria-hidden
            />
            <span className="relative text-4xl font-bold text-white tabular-nums">
              {finished ? "Done" : formatDuration(remaining)}
            </span>
            <span className="relative text-xs text-slate-400">
              Step {Math.min(stepIndex + 1, steps.length)} of {steps.length}
            </span>
          </div>
        </div>

        <p className="min-h-14 max-w-md text-lg font-medium text-white" aria-live="polite">
          {finished ? "Take a moment to notice how you feel." : playing || stepIndex > 0 ? step?.text : data.description}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {finished ? (
            <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={restart}>
              Start again
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                icon={playing ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? "Pause" : stepIndex === 0 && remaining === steps[0]?.seconds ? "Begin" : "Resume"}
              </Button>
              <Button size="lg" variant="outline" icon={<SkipForward className="size-5" />} onClick={skip}>
                Skip step
              </Button>
            </>
          )}
        </div>

        <div className="w-full max-w-md border-t border-white/5 pt-5">
          {completed ? (
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-300">
              <CheckCircle2 className="size-5" aria-hidden /> Saved to your progress
            </p>
          ) : (
            <Button fullWidth variant={finished ? "primary" : "secondary"} loading={completing} onClick={markComplete}>
              {finished ? "Mark as completed" : "I've completed this"}
            </Button>
          )}
          <p className="mt-2 text-xs text-slate-500">
            {data.completed_count > 0
              ? `Completed ${data.completed_count}× · last ${timeAgo(data.last_completed_at!)}`
              : "Not completed yet"}
          </p>
          {data.media_url && (
            <a
              href={data.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-300 hover:underline"
            >
              Open guided audio <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}
