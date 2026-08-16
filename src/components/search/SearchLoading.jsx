import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export default function SearchLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 gap-5"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Leaf className="w-7 h-7 text-primary animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">Searching Nordic plant shops…</p>
        <p className="text-xs text-muted-foreground">Comparing prices from multiple sellers</p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}