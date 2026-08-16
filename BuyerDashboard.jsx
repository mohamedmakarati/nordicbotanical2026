import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag, Gavel, Heart, Bell, Star, Settings,
  Package, Clock, CheckCircle2, AlertCircle, ChevronRight, Leaf
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const ORDER_STATUS = {
  pending_payment: { label: "Inväntar betalning", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  paid:            { label: "Betald", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  shipped:         { label: "Skickad", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Package },
  delivered:       { label: "Levererad", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  cancelled:       { label: "Avbokad", color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
};

export default function BuyerDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bids, setBids] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (!me) { window.location.href = "/login"; return; }
      setUser(me);
      const [ord, bd, wl, notifs, priceAlerts] = await Promise.all([
        base44.entities.Order.filter({ buyer_id: me.id }, "-created_date", 20).catch(() => []),
        base44.entities.Bid.filter({ bidder_id: me.id }, "-created_date", 20).catch(() => []),
        base44.entities.Wishlist.filter({}, "-created_date", 20).catch(() => []),
        base44.entities.Notification.filter({ user_id: me.id }, "-created_date", 30).catch(() => []),
        base44.entities.PriceAlert.filter({ created_by_id: me.id }, "-created_date", 20).catch(() => []),
      ]);
      setOrders(ord);
      setBids(bd);
      setWishlist(wl);
      setNotifications(notifs);
      setAlerts(priceAlerts);
      setLoading(false);
    }).catch(() => { window.location.href = "/login"; });
  }, []);

  const unread = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.is_read);
    await Promise.all(unreadItems.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  const activeBids = bids.filter((b) => b.status === "active");
  const wonBids = bids.filter((b) => b.status === "won");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl text-foreground">
              Välkommen, {user?.full_name?.split(" ")[0] || "Köpare"}
            </h1>
            <p className="text-muted-foreground mt-1">Hantera dina köp, bud och önskelista.</p>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: ShoppingBag, label: "Beställningar", value: orders.length, color: "text-primary" },
              { icon: Gavel, label: "Aktiva bud", value: activeBids.length, color: "text-blue-600" },
              { icon: Heart, label: "Önskelista", value: wishlist.length, color: "text-rose-500" },
              { icon: Bell, label: "Notiser", value: unread, color: "text-amber-500" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-card rounded-2xl border border-border/50 p-5">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <div className="text-2xl font-display text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <Tabs defaultValue="orders">
            <TabsList className="mb-6 h-10 bg-muted/60 rounded-xl p-1">
              <TabsTrigger value="orders" className="rounded-lg text-xs sm:text-sm">
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Beställningar
              </TabsTrigger>
              <TabsTrigger value="bids" className="rounded-lg text-xs sm:text-sm">
                <Gavel className="w-3.5 h-3.5 mr-1.5" /> Bud
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="rounded-lg text-xs sm:text-sm">
                <Heart className="w-3.5 h-3.5 mr-1.5" /> Önskelista
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-lg text-xs sm:text-sm relative">
                <Bell className="w-3.5 h-3.5 mr-1.5" /> Notiser
                {unread > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 font-semibold">{unread}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="rounded-lg text-xs sm:text-sm">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Prisalerter
              </TabsTrigger>
            </TabsList>

            {/* Orders */}
            <TabsContent value="orders">
              {orders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="Inga beställningar än" desc="Handla växter i vår marknadsplats!" cta="Bläddra växter" href="/search" />
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const s = ORDER_STATUS[order.status] || ORDER_STATUS.pending_payment;
                    const Icon = s.icon;
                    return (
                      <div key={order.id} className="bg-card rounded-2xl border border-border/50 p-5 flex items-center gap-4">
                        {order.item_image_url ? (
                          <img src={order.item_image_url} alt={order.item_title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <Leaf className="w-6 h-6 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{order.item_title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(order.created_date), "d MMM yyyy")}
                          </p>
                          {order.tracking_number && (
                            <p className="text-xs text-primary mt-0.5">Spårning: {order.tracking_number}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display text-base text-foreground">{order.total_amount?.toFixed(0)} {order.currency}</div>
                          <Badge className={`text-[10px] border mt-1 ${s.color}`}>
                            <Icon className="w-2.5 h-2.5 mr-1" />{s.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Bids */}
            <TabsContent value="bids">
              {bids.length === 0 ? (
                <EmptyState icon={Gavel} title="Inga bud lagda" desc="Delta i auktioner och hitta unika växter!" cta="Se auktioner" href="/auctions" />
              ) : (
                <div className="space-y-3">
                  {bids.map((bid) => (
                    <div key={bid.id} className="bg-card rounded-2xl border border-border/50 p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Gavel className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">Auktionsbud</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(bid.created_date), "d MMM yyyy HH:mm")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-base text-foreground">{bid.amount?.toFixed(0)} {bid.currency}</div>
                        <Badge variant={bid.status === "active" ? "default" : bid.status === "won" ? "secondary" : "outline"} className="text-[10px] mt-1">
                          {bid.status === "active" ? "Aktivt" : bid.status === "won" ? "Vunnit" : bid.status === "outbid" ? "Överbudat" : bid.status}
                        </Badge>
                      </div>
                      <Link to={`/auctions/${bid.auction_id}`} className="text-muted-foreground hover:text-foreground">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Wishlist */}
            <TabsContent value="wishlist">
              {wishlist.length === 0 ? (
                <EmptyState icon={Heart} title="Önskelistan är tom" desc="Spara dina favoritväxter för att hålla koll på priser." cta="Sök växter" href="/search" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map((item) => (
                    <a key={item.id} href={item.product_url} target="_blank" rel="noopener noreferrer"
                      className="bg-card rounded-2xl border border-border/50 p-4 flex gap-3 hover:border-primary/25 hover:shadow-sm transition-all">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Leaf className="w-5 h-5 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground line-clamp-1">{item.product_title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.seller_name}</p>
                        <p className="text-sm font-semibold text-primary mt-1">{item.price} {item.currency}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-foreground">Notifieringar</h3>
                {unread > 0 && (
                  <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs h-8">
                    Markera alla som lästa
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <EmptyState icon={Bell} title="Inga notiser" desc="Vi meddelar dig när det händer något." />
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className={`flex gap-3 p-4 rounded-xl border transition-colors ${n.is_read ? "bg-card border-border/40" : "bg-primary/5 border-primary/20"}`}>
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{format(new Date(n.created_date), "d MMM HH:mm")}</p>
                      </div>
                      {n.link && (
                        <Link to={n.link} className="text-primary hover:text-primary/70">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Price Alerts */}
            <TabsContent value="alerts">
              {alerts.length === 0 ? (
                <EmptyState icon={AlertCircle} title="Inga prisalerter" desc="Skapa en prisalert så meddelar vi när priset sjunker." cta="Sök växter" href="/search" />
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-card rounded-2xl border border-border/50 p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{alert.plant_name || "Prisalert"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Notifiera vid pris under {alert.target_price} {alert.currency || "SEK"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">{alert.is_active ? "Aktiv" : "Pausad"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, cta, href }) {
  return (
    <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
      <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{desc}</p>
      {cta && href && (
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link to={href}>{cta}</Link>
        </Button>
      )}
    </div>
  );
}