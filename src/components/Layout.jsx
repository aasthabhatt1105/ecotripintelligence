import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Navigation, MessageSquare, User, Leaf, Clock } from "lucide-react";
import { motion } from "framer-motion";
import VoiceAssistant from "./VoiceAssistant";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/track", icon: Navigation, label: "Track" },
  { path: "/history", icon: Clock, label: "History" },
  { path: "/planner", icon: MessageSquare, label: "Planner" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full glass border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">EcoTrip Intelligence</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`relative z-10 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>

      {/* Floating Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
}