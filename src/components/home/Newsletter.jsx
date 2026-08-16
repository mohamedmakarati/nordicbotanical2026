import { useState } from "react";
import { Mail, CheckCircle2, Leaf, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <Leaf className="absolute top-8 right-12 w-32 h-32 text-white/5 rotate-12 hidden lg:block" />
        <Leaf className="absolute bottom-8 left-16 w-20 h-20 text-white/5 -rotate-20 hidden lg:block" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-6 h-6 text-white" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            Få de bästa växterbjudandena
            <br />i din inkorg
          </h2>
          <p className="text-white/65 text-sm sm:text-base mb-10 leading-relaxed">
            Veckovis sammanfattning av de bästa växterbjudandena från nordiska butiker — handplockade och priskontrollerade. Ingen spam, avprenumerera när som helst.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <p className="text-white font-medium">Du är med på listan!</p>
              <p className="text-white/60 text-sm">Vi skickar dig de bästa nordiska växterbjudandena varje vecka.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.se"
                  required
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/40 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-6 rounded-xl bg-white text-primary hover:bg-white/90 font-medium gap-2 shrink-0"
              >
                Prenumerera <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          <p className="text-white/40 text-xs mt-4">
            Ingen spam. Avprenumerera när som helst. Läs vår integritetspolicy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}