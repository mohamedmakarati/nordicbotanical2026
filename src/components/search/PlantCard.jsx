import { useState } from "react";
import { ExternalLink, Award, MapPin, Truck, Check, X, Tag, Heart, Bell, Clock } from "lucide-react";
import PriceHistoryChart from "./PriceHistoryChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

export default function PlantCard({ plant, index, isBestPrice }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [alertSet, setAlertSet] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [showAlertInput, setShowAlertInput] = useState(false);

  const handleWishlist = async () => {
    const user = await base44.auth.me().catch(() => null);
    if (!user) { base44.auth.redirectToLogin(); return; }
    await base44.entities.Wishlist.create({
      product_id: plant.id,
      product_title: plant.name,
      price: plant.price,
      currency: plant.currency,
      image_url: plant.image_url,
      product_url: plant.product_url,
      seller_name: plant.seller_name,
    });
    setWishlisted(true);
  };

  const handleSetAlert = async () => {
    if (!alertPrice) return;
    const user = await base44.auth.me().catch(() => null);
    if (!user) { base44.auth.redirectToLogin(); return; }
    await base44.entities.PriceAlert.create({
      email: user.email,
      product_id: plant.id,
      target_price: parseFloat(alertPrice),
      plant_name: plant.name,
      current_price: plant.price,
    });
    setAlertSet(true);
    setShowAlertInput(false);
  };

  const totalPrice = (plant.price || 0) + (plant.shipping_cost || 0);
  const hasDiscount = plant.regular_price && plant.regular_price > plant.price;
  const discountPct = hasDiscount
    ? Math.round(((plant.regular_price - plant.price) / plant.regular_price) * 100)
    : 0;
  const savings = hasDiscount ? (plant.regular_price - plant.price).toFixed(2) : 0;

  const currency = plant.currency || "SEK";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="group relative bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {isBestPrice && (
          <Badge className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1 text-xs font-medium flex items-center gap-1 shadow-md">
            <Award className="w-3 h-3" />
            Bästa priset
          </Badge>
        )}
        {hasDiscount && (
          <Badge className="bg-destructive text-destructive-foreground rounded-lg px-2.5 py-1 text-xs font-medium flex items-center gap-1 shadow-md">
            <Tag className="w-3 h-3" />
            -{discountPct}%
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted/50 overflow-hidden">
        <img
          src={plant.image_url || `https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&q=80`}
          alt={plant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&q=80";
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display text-base text-foreground leading-snug line-clamp-2">
            {plant.name}
          </h3>
          {plant.latin_name && (
            <p className="text-xs text-muted-foreground italic mt-0.5">{plant.latin_name}</p>
          )}
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-1.5">
          {plant.pot_size && (
            <Badge variant="outline" className="text-[10px] rounded-md font-normal px-2 py-0.5">
              {plant.pot_size}
            </Badge>
          )}
          {plant.seller_country && (
            <Badge variant="outline" className="text-[10px] rounded-md font-normal px-2 py-0.5 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              {plant.seller_country}
            </Badge>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-1.5 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pris</span>
            <div className="flex items-center gap-2">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {plant.regular_price?.toFixed(2)} {currency}
                </span>
              )}
              <span className={`text-sm font-semibold ${hasDiscount ? "text-destructive" : "text-foreground"}`}>
                {plant.price?.toFixed(2)} {currency}
              </span>
            </div>
          </div>
          {hasDiscount && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary font-medium">Du sparar</span>
              <span className="text-xs text-primary font-medium">{savings} {currency}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Truck className="w-3 h-3" /> Frakt
            </span>
            <span className="text-xs text-muted-foreground">
              {plant.shipping_cost === 0 ? (
                <span className="text-primary font-medium">Gratis</span>
              ) : (
                `${plant.shipping_cost?.toFixed(2)} ${currency}`
              )}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-border/40">
            <span className="text-xs font-medium text-foreground">Totalt</span>
            <span className="text-lg font-display text-primary">{totalPrice.toFixed(2)} {currency}</span>
          </div>
        </div>

        {/* Seller + Availability */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium truncate max-w-[60%]">{plant.seller_name}</span>
          <span className={`flex items-center gap-1 font-medium ${plant.availability === "in_stock" ? "text-primary" : "text-destructive"}`}>
            {plant.availability === "in_stock" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {plant.availability === "in_stock" ? "I lager" : "Slut i lager"}
          </span>
        </div>

        {/* Last checked */}
        {plant.last_checked && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Clock className="w-2.5 h-2.5" />
            Uppdaterad {new Date(plant.last_checked).toLocaleDateString("sv-SE")}
          </div>
        )}

        {/* Price alert input */}
        {showAlertInput && (
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Målpris (kr)"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-1.5 text-sm"
            />
            <Button size="sm" onClick={handleSetAlert} className="rounded-xl text-xs px-3">OK</Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            asChild
            variant={isBestPrice ? "default" : "outline"}
            className="flex-1 rounded-xl text-sm h-9 gap-2"
          >
            <a href={plant.product_url} target="_blank" rel="noopener noreferrer">
              Besök <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
          <Button
            variant="ghost" size="icon"
            className={`h-9 w-9 rounded-xl ${wishlisted ? "text-red-500" : "text-muted-foreground"}`}
            onClick={handleWishlist} title="Spara i önskelista"
          >
            <Heart className="w-4 h-4" fill={wishlisted ? "currentColor" : "none"} />
          </Button>
          <Button
            variant="ghost" size="icon"
            className={`h-9 w-9 rounded-xl ${alertSet ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setShowAlertInput(!showAlertInput)} title="Prisbevakning"
          >
            <Bell className="w-4 h-4" fill={alertSet ? "currentColor" : "none"} />
          </Button>
        </div>

        <PriceHistoryChart productId={plant.id} currentPrice={plant.price} currency={plant.currency || "SEK"} />
      </div>
    </motion.div>
  );
}