"use client";

import { useEffect, useState } from "react";

const BLOCKS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 8 + Math.random() * 24,
  delay: Math.random() * 1.5,
  duration: 2 + Math.random() * 2,
}));

const LETTERS = "MegaStats".split("");

export function IntroAnimation() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [lettersDone, setLettersDone] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("intro_shown")) return;
    sessionStorage.setItem("intro_shown", "1");
    setVisible(true);

    // Letters animation done after ~1.2s
    const lettersTimer = setTimeout(() => setLettersDone(true), 1200);

    // Start exit after 2.6s
    const exitTimer = setTimeout(() => setExiting(true), 2600);

    // Remove after exit animation
    const removeTimer = setTimeout(() => setVisible(false), 3400);

    return () => {
      clearTimeout(lettersTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-background transition-opacity duration-700 ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Floating blocks */}
      {BLOCKS.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-md border border-primary/30 bg-primary/5 animate-float-block"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}

      {/* Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-4 z-10">
        {/* Logo letters */}
        <div className="flex items-center">
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              className="text-5xl sm:text-7xl font-bold tracking-tight animate-letter-drop opacity-0"
              style={{
                animationDelay: `${i * 80}ms`,
                animationFillMode: "forwards",
                color: i < 4 ? "hsl(var(--primary))" : "hsl(var(--foreground))",
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <p
          className={`text-sm text-muted-foreground tracking-[0.3em] uppercase transition-opacity duration-500 ${
            lettersDone ? "opacity-100" : "opacity-0"
          }`}
        >
          MegaETH Wallet Analytics
        </p>

        {/* Progress line */}
        <div className="w-48 h-px bg-muted overflow-hidden mt-2">
          <div
            className={`h-full bg-primary transition-all duration-[2000ms] ease-out ${
              lettersDone ? "w-full" : "w-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
