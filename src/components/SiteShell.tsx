import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-hero shadow-glow flex items-center justify-center text-primary-foreground shrink-0">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-extrabold text-sm sm:text-lg text-gradient truncate">MCQ Decoder</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground -mt-0.5 truncate">IT Job Prep Platform</div>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Programming • OOP • DB • More</span>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  const navigate = useNavigate();
  const [taps, setTaps] = useState(0);

  const handleClick = () => {
    const n = taps + 1;
    setTaps(n);
    if (n >= 3) {
      setTaps(0);
      navigate({ to: "/admin" });
    }
    setTimeout(() => setTaps(0), 1500);
  };

  return (
    <footer className="mt-12 border-t border-border bg-background/60">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <button
          onClick={handleClick}
          className="text-sm text-muted-foreground hover:text-primary transition-colors select-none"
          aria-label="Footer"
          title="MCQ Decoder"
        >
          Digital Education Platform • <span className="font-semibold">MCQ Decoder</span>
        </button>
        <div className="text-[11px] text-muted-foreground/70 mt-1">© {new Date().getFullYear()} • Crafted with care</div>
      </div>
    </footer>
  );
}
