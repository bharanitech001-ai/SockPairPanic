import { useState, useEffect } from "react";
import { GameCanvas } from "@/components/GameCanvas";
import { ScoreBoard } from "@/components/ScoreBoard";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Music, Volume2, VolumeX } from "lucide-react";
import useSound from "use-sound";

export default function Home() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Background music - using a simple loop
  // Note: Browsers block autoplay, so we start it on first interaction
  const [playMusic, { stop: stopMusic }] = useSound("https://assets.mixkit.co/music/preview/mixkit-playful-6.mp3", { 
    loop: true, 
    volume: 0.1,
    interrupt: true 
  });

  const startGame = () => {
    setScore(0);
    setGameState("playing");
    if (!isMuted) playMusic();
  };

  const stopGame = () => {
    setGameState("menu");
    stopMusic();
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState("gameover");
    stopMusic(); // Optional: stop music on game over
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) stopMusic();
    // Re-enabling music mid-game logic is tricky with useSound simple hook, 
    // usually we just control volume globally or restart. For simplicity:
    if (isMuted && gameState === "playing") playMusic();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans">
      
      {/* HUD - Always visible when playing */}
      {gameState === "playing" && (
        <div className="absolute top-4 left-0 w-full px-6 flex justify-between items-start z-20 pointer-events-none">
          <div className="glass-panel px-6 py-2 pointer-events-auto">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest block">Score</span>
            <span className="text-4xl font-display text-primary">{score}</span>
          </div>
          
          <button 
            onClick={stopGame}
            className="glass-panel px-6 py-3 pointer-events-auto bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold uppercase tracking-wider transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {/* Mute Button - Always visible */}
      <button 
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/80 shadow-md hover:bg-white transition-colors"
      >
        {isMuted ? <VolumeX className="text-gray-500" /> : <Volume2 className="text-primary" />}
      </button>

      {/* Main Menu Overlay */}
      <AnimatePresence>
        {gameState === "menu" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <h1 className="text-6xl md:text-8xl font-display text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary drop-shadow-sm p-4 animate-bounce">
                Sock Pair<br/>Panic
              </h1>
              <p className="text-xl md:text-2xl font-mono text-gray-600 mt-4 max-w-md mx-auto">
                Drag matching socks together before they pile up!
              </p>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="game-btn game-btn-primary flex items-center gap-3 text-3xl shadow-xl hover:shadow-2xl hover:shadow-primary/20"
            >
              <Play className="w-8 h-8 fill-current" /> START
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameState === "gameover" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <ScoreBoard finalScore={score} onRestart={startGame} />
          </div>
        )}
      </AnimatePresence>

      {/* The Actual Game Canvas */}
      <GameCanvas 
        gameActive={gameState === "playing"}
        onScoreUpdate={setScore}
        onGameOver={handleGameOver}
      />
    </div>
  );
}
