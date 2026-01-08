import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface ScoreBoardProps {
  finalScore: number;
  onRestart: () => void;
}

export function ScoreBoard({ finalScore, onRestart }: ScoreBoardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel max-w-md w-full p-8 mx-4 flex flex-col items-center gap-8 relative z-10"
    >
      <div className="text-center">
        <h2 className="text-5xl font-display text-primary drop-shadow-sm mb-4">Game Over!</h2>
        <p className="text-xl text-muted-foreground font-mono">Your Score</p>
        <div className="text-7xl font-black text-secondary mt-2 drop-shadow-md">{finalScore}</div>
      </div>

      <button 
        onClick={onRestart} 
        className="game-btn game-btn-secondary w-full flex items-center justify-center gap-3 text-2xl py-6"
      >
        <RotateCcw className="w-8 h-8" /> Play Again
      </button>
    </motion.div>
  );
}
