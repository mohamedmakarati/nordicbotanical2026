import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Save } from "lucide-react";

const DEFAULTS = {
  assistant_enabled: "true",
  assistant_max_results: "10",
  assistant_default_language: "en",
  assistant_allowed_sellers: "",
};

export default function AdminAssistantSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.AppSettings.list().then((rows) => {
      const map = {};
      rows.forEach((r) => { map[r.key] = r.value; });
      setSettings((prev) => ({ ...prev, ...map }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const existingRows = await base44.entities.AppSettings.list();
    const existingMap = Object.fromEntries(existingRows.map((r) => [r.key, r]));

    for (const [key, value] of Object.entries(settings)) {
      if (existingMap[key]) {
        await base44.entities.AppSettings.update(existingMap[key].id, { value: String(value) });
      } else {
        await base44.entities.AppSettings.create({ key, value: String(value), label: key });
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Loading settings…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">AI Plant Assistant</h3>
          <p className="text-xs text-muted-foreground">Configure how the assistant behaves for users</p>
        </div>
      </div>

      {/* Enable / Disable */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
        <div>
          <Label className="text-sm font-medium text-foreground">Enable AI Assistant</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Show the assistant chat widget on the site</p>
        </div>
        <Switch
          checked={settings.assistant_enabled === "true"}
          onCheckedChange={(v) => set("assistant_enabled", String(v))}
        />
      </div>

      {/* Max results */}
      <div className="space-y-1.5">
        <Label htmlFor="max_results" className="text-sm font-medium">Maximum Results</Label>
        <p className="text-xs text-muted-foreground">How many products the assistant returns per query (1–20)</p>
        <Input
          id="max_results"
          type="number"
          min={1}
          max={20}
          value={settings.assistant_max_results}
          onChange={(e) => set("assistant_max_results", e.target.value)}
          className="w-32"
        />
      </div>

      {/* Default language */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Default Language</Label>
        <p className="text-xs text-muted-foreground">The assistant's default response language</p>
        <Select
          value={settings.assistant_default_language}
          onValueChange={(v) => set("assistant_default_language", v)}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">🇬🇧 English</SelectItem>
            <SelectItem value="sv">🇸🇪 Svenska</SelectItem>
            <SelectItem value="no">🇳🇴 Norsk</SelectItem>
            <SelectItem value="da">🇩🇰 Dansk</SelectItem>
            <SelectItem value="fi">🇫🇮 Suomi</SelectItem>
            <SelectItem value="ar">🇸🇦 العربية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Allowed sellers */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Allowed Sellers (optional)</Label>
        <p className="text-xs text-muted-foreground">Comma-separated seller names. Leave empty to allow all sellers.</p>
        <Input
          value={settings.assistant_allowed_sellers}
          onChange={(e) => set("assistant_allowed_sellers", e.target.value)}
          placeholder="Plantagen, Blomsterlandet, …"
          className="max-w-sm"
        />
      </div>

      <Button onClick={saveSettings} disabled={saving} className="gap-2">
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Settings"}
      </Button>
    </div>
  );
}