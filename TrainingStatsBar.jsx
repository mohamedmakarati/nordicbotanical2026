import { FileText, CheckCircle, X, Copy, Clock, Download } from "lucide-react";

export default function TrainingStatsBar({ stats }) {
  const items = [
    { label: "Totalt", value: stats.total, icon: FileText, color: "text-foreground" },
    { label: "Väntar", value: stats.pending, icon: Clock, color: "text-amber-600" },
    { label: "Importerade", value: stats.imported, icon: Download, color: "text-primary" },
    { label: "Godkända", value: stats.approved, icon: CheckCircle, color: "text-green-600" },
    { label: "Avvisade", value: stats.rejected, icon: X, color: "text-red-500" },
    { label: "Duplikat", value: stats.duplicate, icon: Copy, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
      {items.map((item) => (
        <div key={item.label} className="bg-card border border-border/40 rounded-2xl p-3 text-center">
          <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
          <p className="font-display text-xl text-foreground">{item.value ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}