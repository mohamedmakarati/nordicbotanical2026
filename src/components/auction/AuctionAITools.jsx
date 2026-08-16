import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Tag, FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function AuctionAITools({ form, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [suggestions, setSuggestions] = useState({ titles: [], price: null });

  const generateTitles = async () => {
    if (!form.plant_name) return;
    setLoadingTitle(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generera 3 kreativa svenska auktionstitlar för en växt:
Växtnamn: ${form.plant_name}
Vetenskapligt namn: ${form.scientific_name || "okänt"}
Kategori: ${form.category}
Skick: ${form.condition}
Höjd: ${form.height_cm ? form.height_cm + " cm" : "okänt"}
Krukstorlek: ${form.pot_size || "okänt"}

Titlarna ska vara lockande, informativa och max 60 tecken. Skriv på svenska.
Returnera JSON: { "titles": ["titel1", "titel2", "titel3"] }`,
      response_json_schema: {
        type: "object",
        properties: { titles: { type: "array", items: { type: "string" } } }
      }
    });
    setSuggestions(p => ({ ...p, titles: res?.titles || [] }));
    setLoadingTitle(false);
  };

  const generateDescription = async () => {
    if (!form.plant_name) return;
    setLoadingDesc(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Skriv en lockande och informativ produktbeskrivning för en växtauktion på svenska.

Växt: ${form.plant_name} (${form.scientific_name || ""})
Kategori: ${form.category}
Skick: ${form.condition}
Ålder: ${form.age_months ? form.age_months + " månader" : "okänt"}
Höjd: ${form.height_cm ? form.height_cm + " cm" : "okänt"}
Krukstorlek: ${form.pot_size || "okänt"}
Befintlig beskrivning: ${form.description || "(ingen)"}

Skriv 3–4 meningar: vad gör växten unik, skötselinfo, och varför köparen ska buda. Använd en entusiastisk men seriös ton.
Returnera JSON: { "description": "..." }`,
      response_json_schema: {
        type: "object",
        properties: { description: { type: "string" } }
      }
    });
    if (res?.description) onUpdate("description", res.description);
    setLoadingDesc(false);
  };

  const suggestPrice = async () => {
    if (!form.plant_name) return;
    setLoadingPrice(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Föreslå ett rimligt startpris och köp-nu-pris i SEK för en växtauktion på den svenska marknaden.

Växt: ${form.plant_name} (${form.scientific_name || ""})
Kategori: ${form.category}
Skick: ${form.condition}
Höjd: ${form.height_cm ? form.height_cm + " cm" : "okänt"}
Krukstorlek: ${form.pot_size || "okänt"}

Basera på typiska svenska växtpriser online (Plantagen, Blomsterlandet, Facebook-grupper).
Returnera JSON: { "starting_price": 99, "buy_now_price": 299, "reasoning": "kort motivering" }`,
      response_json_schema: {
        type: "object",
        properties: {
          starting_price: { type: "number" },
          buy_now_price: { type: "number" },
          reasoning: { type: "string" }
        }
      }
    });
    setSuggestions(p => ({ ...p, price: res }));
    setLoadingPrice(false);
  };

  return (
    <div className="border border-primary/20 rounded-xl bg-primary/5 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI-verktyg för din annons</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-primary/10">
          {/* Title generator */}
          <div className="space-y-2 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-primary" /> Generera titel</p>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1.5"
                onClick={generateTitles} disabled={loadingTitle || !form.plant_name}>
                {loadingTitle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Generera
              </Button>
            </div>
            {suggestions.titles.length > 0 && (
              <div className="space-y-1.5">
                {suggestions.titles.map((t, i) => (
                  <button key={i} onClick={() => onUpdate("plant_name", t)}
                    className="w-full text-left text-xs p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-colors text-foreground">
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description generator */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-primary" /> Generera beskrivning</p>
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1.5"
              onClick={generateDescription} disabled={loadingDesc || !form.plant_name}>
              {loadingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Generera
            </Button>
          </div>

          {/* Price suggestion */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> AI prisförslag</p>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1.5"
                onClick={suggestPrice} disabled={loadingPrice || !form.plant_name}>
                {loadingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Föreslå pris
              </Button>
            </div>
            {suggestions.price && (
              <div className="bg-white rounded-lg border border-border/40 p-3 text-xs space-y-2">
                <div className="flex gap-3">
                  <div className="flex-1 text-center p-2 bg-primary/5 rounded-lg">
                    <p className="text-muted-foreground">Startpris</p>
                    <p className="text-base font-bold text-primary">{suggestions.price.starting_price} kr</p>
                    <button onClick={() => onUpdate("starting_price", String(suggestions.price.starting_price))}
                      className="text-[10px] text-primary hover:underline mt-0.5">Använd</button>
                  </div>
                  <div className="flex-1 text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-muted-foreground">Köp nu</p>
                    <p className="text-base font-bold text-green-700">{suggestions.price.buy_now_price} kr</p>
                    <button onClick={() => onUpdate("buy_now_price", String(suggestions.price.buy_now_price))}
                      className="text-[10px] text-green-700 hover:underline mt-0.5">Använd</button>
                  </div>
                </div>
                {suggestions.price.reasoning && (
                  <p className="text-muted-foreground italic">{suggestions.price.reasoning}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}