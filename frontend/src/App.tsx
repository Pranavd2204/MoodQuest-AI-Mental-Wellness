import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { OpenRoute, ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuards";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { WelcomePage } from "@/pages/WelcomePage";

const ActivityPlayerPage = lazy(() => import("@/pages/ActivityPlayerPage").then((m) => ({ default: m.ActivityPlayerPage })));
const ChatPage = lazy(() => import("@/pages/ChatPage").then((m) => ({ default: m.ChatPage })));
const EmergencyPage = lazy(() => import("@/pages/EmergencyPage").then((m) => ({ default: m.EmergencyPage })));
const EmotionPage = lazy(() => import("@/pages/EmotionPage").then((m) => ({ default: m.EmotionPage })));
const GamePlayPage = lazy(() => import("@/pages/GamePlayPage").then((m) => ({ default: m.GamePlayPage })));
const GamesPage = lazy(() => import("@/pages/GamesPage").then((m) => ({ default: m.GamesPage })));
const JournalPage = lazy(() => import("@/pages/JournalPage").then((m) => ({ default: m.JournalPage })));
const MeditationPage = lazy(() => import("@/pages/MeditationPage").then((m) => ({ default: m.MeditationPage })));
const MoviesPage = lazy(() => import("@/pages/MoviesPage").then((m) => ({ default: m.MoviesPage })));
const MusicPage = lazy(() => import("@/pages/MusicPage").then((m) => ({ default: m.MusicPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const ProgressPage = lazy(() => import("@/pages/ProgressPage").then((m) => ({ default: m.ProgressPage })));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<OpenRoute />}>
        <Route path="/emergency" element={<EmergencyPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/emotion" element={<EmotionPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:gameId" element={<GamePlayPage />} />
        <Route path="/meditation" element={<MeditationPage />} />
        <Route path="/meditation/:activityId" element={<ActivityPlayerPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
