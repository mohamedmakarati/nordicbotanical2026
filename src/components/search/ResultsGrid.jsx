import PlantCard from "./PlantCard";
import { motion } from "framer-motion";
import { Sprout } from "lucide-react";

export default function ResultsGrid({ results, query }) {
  if (!results || results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <Sprout className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">
          Inga resultat hittades för "<span className="font-medium text-foreground">{query}</span>". Prova ett annat växtnamn.
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{results.length}</span> resultat för "
          <span className="font-medium text-foreground">{query}</span>"
        </p>
        <p className="text-xs text-muted-foreground">🏆 Bästa priset är markerat</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {results.map((plant, index) => (
          <PlantCard
            key={plant.id || `${plant.seller_name}-${plant.name}-${index}`}
            plant={plant}
            index={index}
            isBestPrice={index === 0}
          />
        ))}
      </div>
    </div>
  );
}