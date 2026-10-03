import {
  BookOpen,
  ChartColumn,
  Clapperboard,
  Flower2,
  Gamepad2,
  House,
  MessageCircle,
  Music,
  Phone,
  ScanFace,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/progress", label: "Progress", icon: ChartColumn },
  { to: "/profile", label: "Profile", icon: User },
];

export const EMOTION_NAV: NavItem = { to: "/emotion", label: "Emotion Detection", icon: ScanFace };

export const EXPLORE_NAV: NavItem[] = [
  { to: "/music", label: "Music", icon: Music },
  { to: "/movies", label: "Movies", icon: Clapperboard },
  { to: "/meditation", label: "Meditation", icon: Flower2 },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/emergency", label: "Emergency Help", icon: Phone },
];
