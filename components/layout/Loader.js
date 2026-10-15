import { Loader2 } from "lucide-react";

export default function Loader({ label, size = 16 }) {
  return (
    <div className="flex animate-fade-in items-center gap-2.5 text-base-400">
      <span className="relative flex items-center justify-center">
        <span className="absolute h-full w-full animate-pulse-glow rounded-full bg-accent/20 blur-sm" />
        <Loader2 size={size} className="relative animate-spin text-accent" />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
