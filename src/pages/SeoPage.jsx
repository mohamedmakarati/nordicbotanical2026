import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Gavel, Search, Leaf, ArrowRight, Camera, TrendingDown } from "lucide-react";

const SEO_PAGES = {
  "vaxtauktion-sverige": {
    title: "Växtauktion Sverige",
    metaTitle: "Växtauktion Sverige | Köp och sälj växter online | Nordic Botanical",
    metaDesc: "Nordic Botanical är Sveriges ledande växtauktion. Köp och sälj växter, sticklingar och trädgårdsväxter online. Jämför priser från plantskolor och trädgårdsbutiker.",
    h1: "Växtauktion i Sverige",
    intro: "Välkommen till Nordic Botanical — Sveriges ledande plattform för växtauktioner. Här kan privatpersoner, plantskolor och växtbutiker köpa och sälja växter online i en trygg och enkel miljö.",
    sections: [
      { title: "Vad är en växtauktion?", body: "En växtauktion är ett smidigt sätt att köpa och sälja växter till bästa pris. Budgivare tävlar om att vinna auktionen, och vinnaren betalar det högsta budet. På Nordic Botanical hittar du allt från sällsynta tropiska växter till trädgårdsperenner och sticklingar." },
      { title: "Varför sälja växter på auktion?", body: "Auktionsformatet ger dig möjlighet att nå rätt köpare och ofta ett bättre pris än vad en fast prislista erbjuder. Särskilt sällsynta och eftertraktade växter kan ropa upp till flera gånger sin normala handelspris." },
      { title: "Säkra auktioner i Sverige", body: "Alla säljare på Nordic Botanical granskas och godkänns av vårt team. Vi samarbetar med svenska betaltjänster för trygg betalning och erbjuder köparskydd på alla köp." },
    ],
    cta: { label: "Se aktiva auktioner", href: "/auctions", icon: Gavel },
  },
  "kop-vaxter-online": {
    title: "Köp växter online",
    metaTitle: "Köp växter online i Sverige | Jämför priser | Nordic Botanical",
    metaDesc: "Köp växter online och jämför priser från svenska plantskolor och trädgårdsbutiker. Hitta bästa priset på inomhusväxter, utomhusväxter, orkidéer och mer.",
    h1: "Köp växter online — jämför priser",
    intro: "Nordic Botanical samlar produkter från Plantagen, Blomsterlandet och många fler svenska växthandlare. Jämför priser enkelt och hitta bästa köpet.",
    sections: [
      { title: "Jämför priser från svenska butiker", body: "Vi samlar in priser dagligen från de flesta stora växthandlarna i Sverige. Oavsett om du letar efter en Monstera, lavendel eller en exotisk tropisk växt — vi hjälper dig hitta det lägsta priset." },
      { title: "Spara med prisalerter", body: "Skapa en prisalert för din drömväxt och vi skickar ett meddelande när priset sjunker. Perfekt för dig som håller koll på budget." },
    ],
    cta: { label: "Sök växter nu", href: "/search", icon: Search },
  },
  "salj-vaxter-online": {
    title: "Sälj växter online",
    metaTitle: "Sälj växter online i Sverige | Nordic Botanical",
    metaDesc: "Sälj dina växter online på Nordic Botanical. Skapa en auktion, nå tusentals växtköpare och få betalt tryggt. Gratis för privatpersoner att registrera sig.",
    h1: "Sälj dina växter online",
    intro: "Har du växter att sälja? Nordic Botanical kopplar ihop dig med tusentals växtköpare i hela Sverige. Enkelt, tryggt och lönsamt.",
    sections: [
      { title: "Hur säljer jag en växt?", body: "Registrera dig som säljare, skapa din auktion med bilder och beskrivning, och vänta på bud. Hela processen tar under 10 minuter. Vår AI hjälper dig till och med skriva en bra beskrivning." },
      { title: "Provision och avgifter", body: "Nordic Botanical tar 8% provision på lyckade försäljningar. Det finns inga dolda avgifter eller startavgifter. Privatpersoner registrerar sig gratis." },
      { title: "Säker betalning", body: "Vi stöder Stripe, Klarna och Swish. Betalningen hålls i escrow tills avsändning bekräftas — trygghet för både säljare och köpare." },
    ],
    cta: { label: "Bli säljare", href: "/seller/register", icon: Gavel },
  },
  "ovanliga-vaxter-auktion": {
    title: "Ovanliga växter auktion",
    metaTitle: "Ovanliga växter auktion Sverige | Sällsynta tropiska växter | Nordic Botanical",
    metaDesc: "Hitta ovanliga och sällsynta växter på auktion i Sverige. Monstera, Philodendron, Anthurium, orkidéer och mer. Auktionera och samla unika växter.",
    h1: "Ovanliga växter på auktion",
    intro: "Letar du efter något riktigt sällsynt? Nordic Botanical är hem för Sveriges växtsamlare. Här hittar du ovanliga tropiska växter, sticklingar av eftertraktade sorter och mer.",
    sections: [
      { title: "Populära sällsynta växter", body: "Monstera Thai Constellation, Philodendron gloriosum, Anthurium veitchii, Variegated Syngonium — dessa och hundratals andra ovanliga växter säljs på Nordic Botanical." },
      { title: "Bevaka sällsynta växter", body: "Lägg en auktion på din önskelista och aktivera notiser för slutande auktioner. Missa aldrig din drömväxt igen." },
    ],
    cta: { label: "Se ovanliga växter", href: "/auctions?category=tropical", icon: Leaf },
  },
  "sticklingar-auktion": {
    title: "Sticklingar auktion",
    metaTitle: "Sticklingar auktion Sverige | Köp och sälj sticklingar | Nordic Botanical",
    metaDesc: "Köp och sälj sticklingar på auktion i Sverige. Hitta sticklingar av Monstera, Pothos, Tradescantia, Begonia och många fler populära växter.",
    h1: "Sticklingar på auktion",
    intro: "Sticklingar är ett populärt och prisvärt sätt att bygga sin växtsamling. På Nordic Botanical hittar du sticklingar från svenska växtodlare och privatpersoner.",
    sections: [
      { title: "Varför köpa sticklingar?", body: "Sticklingar är billigare än fullvuxna växter och roliga att odla upp själv. Dessutom är det ett miljösmart sätt att sprida växter vidare." },
      { title: "Sälja dina överskottssticklingar", body: "Har du rotat eller orotade sticklingar från dina favoritväxter? Tjäna lite extra pengar och hjälp andra växtälskare att bygga sina samlingar." },
    ],
    cta: { label: "Bläddra sticklingar", href: "/auctions", icon: Leaf },
  },
  "monstera-auktion": {
    title: "Monstera auktion",
    metaTitle: "Monstera auktion Sverige | Köp Monstera online | Nordic Botanical",
    metaDesc: "Hitta Monstera deliciosa, Thai Constellation, Adansonii och sällsynta Monstera-varianter på auktion i Sverige. Jämför priser och buda på din favorit.",
    h1: "Monstera på auktion i Sverige",
    intro: "Monstera är en av världens mest populära inomhusväxter. På Nordic Botanical hittar du allt från klassisk Monstera deliciosa till sällsynta variegerade varianter.",
    sections: [
      { title: "Monstera-sorter på Nordic Botanical", body: "Monstera deliciosa, Monstera adansonii, Monstera Thai Constellation, Monstera albo variegata, Monstera pinnatipartita — vi har de populäraste och sällsyntaste sorterna." },
      { title: "Prisjämförelse på Monstera", body: "Använd vår prismotor för att jämföra Monstera-priser från Plantagen, Blomsterlandet och oberoende säljare. Hitta alltid bästa priset." },
    ],
    cta: { label: "Sök Monstera", href: "/search?q=monstera", icon: Search },
  },
  "tradgardsvaxter-auktion": {
    title: "Trädgårdsväxter auktion",
    metaTitle: "Trädgårdsväxter auktion Sverige | Köp trädgårdsväxter online | Nordic Botanical",
    metaDesc: "Köp och sälj trädgårdsväxter på auktion i Sverige. Perenner, rosor, buskar, fruktträd och mer från svenska plantskolor och privatpersoner.",
    h1: "Trädgårdsväxter på auktion",
    intro: "Bygg din drömträdgård med växter från Nordic Botanical. Vi har ett brett utbud av perenner, rosor, fruktträd och buskar från plantskolor och trädgårdsodlare.",
    sections: [
      { title: "Perenner och rosor", body: "Hitta ett stort utbud av vinterhärdiga perenner och rosor för svenska klimatförhållanden. Många odlare erbjuder lokalt odlade växter anpassade till din zon." },
      { title: "Fruktträd och buskar", body: "Äppelträd, plommon, bärbuskar och häckväxter — Nordic Botanical har ett brett sortiment av frukt- och bärväxter anpassade för Sverige." },
    ],
    cta: { label: "Sök trädgårdsväxter", href: "/search?category=tree", icon: Search },
  },
  "plantskola-sverige": {
    title: "Plantskola Sverige",
    metaTitle: "Plantskola Sverige | Jämför plantskolor online | Nordic Botanical",
    metaDesc: "Hitta och jämför plantskolor i Sverige. Köp direkt från svenska plantskolor online och jämför priser på växter, träd och buskar.",
    h1: "Plantskolor i Sverige",
    intro: "Nordic Botanical samarbetar med plantskolor runt om i Sverige. Jämför priser, läs recensioner och handla direkt från din närmaste plantskola online.",
    sections: [
      { title: "Varför köpa från en plantskola?", body: "Plantskolor erbjuder professionellt odlade växter med hög kvalitet. Många plantskolor specialiserar sig på specifika arter och kan ge expertråd om skötsel och klimatanpassning." },
      { title: "Hitta plantskola nära dig", body: "Använd vår butikskatalog för att hitta plantskolor i din region. Många erbjuder både onlineförsäljning och lokal upphämtning." },
    ],
    cta: { label: "Se alla plantskolor", href: "/sellers", icon: Leaf },
  },
  "vaxtmarknad-online": {
    title: "Växtmarknad online",
    metaTitle: "Växtmarknad online Sverige | Köp och sälj växter | Nordic Botanical",
    metaDesc: "Nordic Botanical är din digitala växtmarknad i Sverige. Jämför priser, köp på auktion och hitta sällsynta växter från säljare runt om i landet.",
    h1: "Växtmarknad online i Sverige",
    intro: "Nordic Botanical är din digitala växtmarknad — en plats där växtälskare möts för att köpa, sälja och dela sin passion för växter.",
    sections: [
      { title: "Allt på ett ställe", body: "Prisjämförelse, auktioner, plantskolor, sticklingar och AI-verktyg — allt samlat i en plattform byggd för svenska växtälskare." },
      { title: "Community för växtälskare", body: "Gå med i en växande gemenskap av växtsamlare, odlare och naturälskare. Dela dina favoritväxter, tipsa om bra köp och inspirera andra." },
    ],
    cta: { label: "Utforska marknadsplatsen", href: "/search", icon: Search },
  },
};

export default function SeoPage() {
  const { slug } = useParams();
  const page = SEO_PAGES[slug];

  if (!page) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Sidan hittades inte.</div>
      <Footer />
    </div>
  );

  const CtaIcon = page.cta.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <head>
        <title>{page.metaTitle}</title>
        <meta name="description" content={page.metaDesc} />
        <meta property="og:title" content={page.metaTitle} />
        <meta property="og:description" content={page.metaDesc} />
      </head>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-b from-accent/40 to-background border-b border-border/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4">
              <Leaf className="w-3.5 h-3.5" /> Nordic Botanical
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-4 leading-tight">{page.h1}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto mb-8">{page.intro}</p>
            <Button asChild size="lg" className="rounded-xl gap-2 h-12 px-8">
              <Link to={page.cta.href}>
                <CtaIcon className="w-5 h-5" /> {page.cta.label} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Content sections */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
          {page.sections.map((s, i) => (
            <section key={i} className="prose prose-slate max-w-none">
              <h2 className="font-display text-2xl text-foreground mb-3">{s.title}</h2>
              <p className="text-muted-foreground leading-relaxed text-base">{s.body}</p>
            </section>
          ))}

          {/* Related pages */}
          <div className="border-t border-border/40 pt-8">
            <h3 className="font-medium text-foreground mb-4 text-sm uppercase tracking-wider">Utforska mer</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(SEO_PAGES)
                .filter(([k]) => k !== slug)
                .slice(0, 6)
                .map(([k, p]) => (
                  <Link key={k} to={`/guide/${k}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors p-3 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-primary/5">
                    {p.title} →
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}