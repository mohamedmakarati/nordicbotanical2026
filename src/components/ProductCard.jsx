import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { Badge } from "@/components/ui/badge";
import { realImageUrl, formatPrice } from "@/lib/product";

export default function ProductCard({ product }) {
  const price = product["Pris (SEK)"];
  const original = product["Ordinarie Pris (SEK)"];
  const discount =
    original && price && original > price ? Math.round((1 - price / original) * 100) : 0;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {product["Produktbild"] ? (
          <Image
            src={realImageUrl(product["Produktbild"])}
            alt={product["Produktnamn"]}
            fittingType="fill"
            className="h-full w-full transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Ingen bild
          </div>
        )}
        {discount > 0 && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            -{discount}%
          </Badge>
        )}
      </div>
      <div className="mt-2">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {product["Produktnamn"]}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold">{formatPrice(price)}</span>
          {original && original > price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(original)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}