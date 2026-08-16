import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

function getTimeLeft(endDate) {
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, diff };
}

export default function AuctionCountdown({ endDate, compact }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endDate));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(endDate)), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (!timeLeft) return (
    <div className={`flex items-center gap-1 text-red-600 ${compact ? "text-xs" : "text-sm"}`}>
      <Clock className={compact ? "w-3 h-3" : "w-4 h-4"} /> Auktionen har avslutats
    </div>
  );

  const isUrgent = timeLeft.diff < 3600000; // < 1 hour

  if (compact) return (
    <div className={`flex items-center gap-1 text-xs ${isUrgent ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
      <Clock className="w-3 h-3" />
      {timeLeft.d > 0 ? `${timeLeft.d}d ${timeLeft.h}h` : `${timeLeft.h}h ${timeLeft.m}m ${timeLeft.s}s`}
    </div>
  );

  return (
    <div className={`p-3 rounded-xl border ${isUrgent ? "border-red-200 bg-red-50" : "border-border/50 bg-muted/30"}`}>
      <p className={`text-xs mb-2 font-medium ${isUrgent ? "text-red-600" : "text-muted-foreground"}`}>
        <Clock className="w-3 h-3 inline mr-1" />Slutar om
      </p>
      <div className="flex gap-3">
        {[["d","Dagar"],["h","Tim"],["m","Min"],["s","Sek"]].map(([k, l]) => (
          (k !== "d" || timeLeft.d > 0) && (
            <div key={k} className="text-center">
              <p className={`text-2xl font-bold tabular-nums ${isUrgent ? "text-red-700" : "text-foreground"}`}>{String(timeLeft[k]).padStart(2,"0")}</p>
              <p className="text-xs text-muted-foreground">{l}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}