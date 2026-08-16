import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sun, Droplets, Ruler, Package, Sprout } from "lucide-react";
import { realImageUrl, formatPrice } from "@/lib/product";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    base44.entities.Product
      .get(id)
      .then((p) => {
        setProduct(p);
        setLoading(false);
        if (!p) setNotFound(true);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  if (notFound || !product)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Växten hittades inte.</p>
        <Link to="/">
          <Button variant="outline">Tillbaka till butiken</Button>
        </Link>
      </div>
    );

  const price = product["Pris (SEK)"];
  const original = product["Ordinarie Pris (SEK)"];
  const discount =
    original && price && original > price ? Math.round((1 - price / original) * 100) : 0;

  const specs = [
    { icon: Sun, label: "Ljusbehov", value: product["Ljusbehov"] },
    { icon: Droplets, label: "Vattenbehov", value: product["Vattenbehov"] },
    {
      icon: Ruler,
      label: "Höjd",
      value: product["Höjd (cm)"] ? product["Höjd (cm)"] + " cm" : "",
    },
    {
      icon: Package,
      label: "Krukstorlek",
      value: product["Krukstorlek (cm)"] ? product["Krukstorlek (cm)"] + " cm" : "",
    },
  ].filter((s) => s.value);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
            Nordic Botanical
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Tillbaka
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            {product["Produktbild"] ? (
              <Image
                src={realImageUrl(product["Produktbild"])}
                alt={product["Produktnamn"]}
                fittingType="fill"
                className="h-full w-full"
              />
            ) : null}
            {discount > 0 && (
              <Badge variant="destructive" className="absolute left-3 top-3 text-base">
                -{discount}%
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{product["Produktnamn"]}</h1>
            {product["Färg"] && (
              <p className="mt-1 text-muted-foreground">{product["Färg"]}</p>
            )}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{formatPrice(price)}</span>
              {original && original > price && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(original)}
                </span>
              )}
            </div>

            {specs.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {specs.map((s) => (
                  <div key={s.label} className="flex items-center gap-3 rounded-xl border p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="text-sm font-medium">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {product["Produktbeskrivning"] && (
              <div className="mt-6">
                <h2 className="mb-2 font-semibold">Beskrivning</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product["Produktbeskrivning"]}
                </p>
              </div>
            )}

            {product["Produkt URL"] && (
              <a
                href={product["Produkt URL"]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="mt-8 w-full md:w-auto" size="lg">
                  Besök produktsida
                </Button>
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}