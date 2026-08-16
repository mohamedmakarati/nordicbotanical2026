import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star className={`w-4 h-4 ${(hovered || value) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

export default function NurseryReviews({ nurseryId, nurseryName }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: "", reviewer_name: "", reviewer_email: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.UserReview.filter({ reviewed_user_id: nurseryId })
      .then(setReviews).finally(() => setLoading(false));
  }, [nurseryId]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const handleSubmit = async () => {
    if (!form.reviewer_name || !form.comment) return;
    setSubmitting(true);
    const created = await base44.entities.UserReview.create({
      reviewed_user_id: nurseryId,
      reviewer_user_id: "guest",
      reviewer_name: form.reviewer_name,
      rating: form.rating,
      comment: form.comment,
    });
    setReviews(prev => [created, ...prev]);
    setShowForm(false);
    setForm({ rating: 5, comment: "", reviewer_name: "", reviewer_email: "" });
    setSubmitting(false);
  };

  if (loading) return <div className="h-20 flex items-center justify-center"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      {avg && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-2xl border border-border/60">
          <div className="text-center">
            <div className="font-display text-4xl">{avg}</div>
            <StarRating value={Math.round(parseFloat(avg))} />
            <div className="text-xs text-muted-foreground mt-1">{reviews.length} recensioner</div>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-3">{star}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${reviews.length ? (count/reviews.length)*100 : 0}%` }} />
                  </div>
                  <span className="w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5">
        <Button onClick={() => setShowForm(!showForm)} variant="outline" className="rounded-xl gap-2 text-sm">
          <MessageSquare className="w-4 h-4" /> Skriv recension
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-primary/20 p-5 mb-6 space-y-3">
          <h3 className="font-medium text-sm">Din recension av {nurseryName}</h3>
          <StarRating value={form.rating} onChange={r => setForm(f => ({...f, rating: r}))} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Ditt namn *" value={form.reviewer_name} onChange={e => setForm(f => ({...f, reviewer_name: e.target.value}))} className="rounded-xl" />
            <Input type="email" placeholder="E-post (visas ej)" value={form.reviewer_email} onChange={e => setForm(f => ({...f, reviewer_email: e.target.value}))} className="rounded-xl" />
          </div>
          <textarea rows={3} value={form.comment} onChange={e => setForm(f => ({...f, comment: e.target.value}))}
            placeholder="Berätta om din upplevelse..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          <Button onClick={handleSubmit} disabled={submitting || !form.reviewer_name || !form.comment} className="rounded-xl">
            {submitting ? "Skickar..." : "Skicka recension"}
          </Button>
        </motion.div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          Inga recensioner ännu. Bli den första!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border/60 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{review.reviewer_name}</p>
                  <p className="text-xs text-muted-foreground">{review.created_date ? format(new Date(review.created_date), "d MMMM yyyy", { locale: sv }) : ""}</p>
                </div>
                <StarRating value={review.rating} />
              </div>
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}