import { useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { Howl } from "howler";

// --- Game Constants & Types ---
const SOCK_WIDTH = 50;
const SOCK_HEIGHT = 70;
const SPAWN_RATE_INITIAL = 1500; // ms
const GRAVITY_INITIAL = 1.5;
const MATCH_DISTANCE = 40;
const GAME_LIMIT_Y = 150; // Pixels from top where "Game Over" happens if stacked

type SockType = {
  id: string;
  x: number;
  y: number;
  pattern: "striped" | "polka" | "plain" | "zigzag";
  color: string;
  vx: number;
  vy: number;
  isDragging: boolean;
  rotation: number;
  isStacked: boolean; // If true, it has landed and stopped moving
};

const PATTERNS = ["striped", "polka", "plain", "zigzag"] as const;
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#9B5DE5", "#F15BB5"];

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
  gameActive: boolean;
}

// Sound Effects - Updated URLs and config
const popSound = new Howl({ 
  src: ["https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73456.mp3"], 
  volume: 0.8,
  html5: true
});
const collisionSound = new Howl({ 
  src: ["https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3"], 
  volume: 0.6,
  html5: true
});
const gameOverSound = new Howl({ 
  src: ["https://cdn.pixabay.com/audio/2021/08/04/audio_bb3e18a221.mp3"], 
  volume: 0.8,
  html5: true
});
const fallingSound = new Howl({ 
  src: ["https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13d69d0.mp3"], 
  volume: 0.2, 
  rate: 1.5,
  html5: true
});

export function GameCanvas({ onScoreUpdate, onGameOver, gameActive }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const socksRef = useRef<SockType[]>([]);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const difficultyRef = useRef<number>(1);
  const activeDragId = useRef<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // --- Helpers ---
  const createSock = (x: number): SockType => ({
    id: Math.random().toString(36).substr(2, 9),
    x,
    y: -SOCK_HEIGHT,
    pattern: PATTERNS[Math.floor(Math.random() * PATTERNS.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx: (Math.random() - 0.5) * 2,
    vy: 0,
    isDragging: false,
    rotation: (Math.random() - 0.5) * 0.2,
    isStacked: false,
  });

  const drawSock = (ctx: CanvasRenderingContext2D, sock: SockType) => {
    ctx.save();
    ctx.translate(sock.x, sock.y);
    ctx.rotate(sock.rotation);
    ctx.beginPath();
    ctx.fillStyle = sock.color;
    ctx.moveTo(-SOCK_WIDTH / 2, -SOCK_HEIGHT / 2);
    ctx.lineTo(SOCK_WIDTH / 2, -SOCK_HEIGHT / 2);
    ctx.lineTo(SOCK_WIDTH / 2, SOCK_HEIGHT / 4);
    ctx.quadraticCurveTo(SOCK_WIDTH / 2, SOCK_HEIGHT / 2, 0, SOCK_HEIGHT / 2);
    ctx.lineTo(-SOCK_WIDTH / 4, SOCK_HEIGHT / 2);
    ctx.quadraticCurveTo(-SOCK_WIDTH, SOCK_HEIGHT / 2, -SOCK_WIDTH, SOCK_HEIGHT / 4); 
    ctx.lineTo(-SOCK_WIDTH / 2, -SOCK_HEIGHT / 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    if (sock.pattern === "striped") {
      for (let i = -SOCK_HEIGHT/2; i < SOCK_HEIGHT/2; i += 15) {
        ctx.fillRect(-SOCK_WIDTH/2, i, SOCK_WIDTH, 5);
      }
    } else if (sock.pattern === "polka") {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((i * 15) - 10, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (sock.pattern === "zigzag") {
       ctx.beginPath();
       ctx.moveTo(-SOCK_WIDTH/2, 0);
       ctx.lineTo(-10, 10);
       ctx.lineTo(10, -10);
       ctx.lineTo(SOCK_WIDTH/2, 0);
       ctx.strokeStyle = "rgba(255,255,255,0.6)";
       ctx.lineWidth = 3;
       ctx.stroke();
    }
    if (sock.isDragging) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(255,255,255,0.8)";
    }
    ctx.restore();
  };

  const checkCollisions = (sock: SockType, allSocks: SockType[], canvasHeight: number) => {
    if (sock.y + SOCK_HEIGHT / 2 >= canvasHeight - 20) {
      sock.y = canvasHeight - 20 - SOCK_HEIGHT / 2;
      sock.vy = 0;
      sock.vx = 0;
      sock.isStacked = true;
      return { matched: false };
    }
    for (const other of allSocks) {
      if (sock.id === other.id) continue;
      const dx = sock.x - other.x;
      const dy = sock.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (sock.isDragging && distance < MATCH_DISTANCE) {
        if (sock.color === other.color && sock.pattern === other.pattern) {
          return { matched: true, otherId: other.id };
        }
      }
      if (!sock.isDragging && !other.isDragging && other.isStacked) {
        if (Math.abs(dx) < SOCK_WIDTH * 0.8 && dy < 0 && Math.abs(dy) < SOCK_HEIGHT) {
           if (sock.y + SOCK_HEIGHT/2 >= other.y - SOCK_HEIGHT/2 + 10) {
              sock.y = other.y - SOCK_HEIGHT + 10;
              sock.vy = 0;
              sock.vx = 0;
              sock.isStacked = true;
           }
        }
      }
    }
    return { matched: false };
  };

  const update = (time: number) => {
    if (!gameActive) return;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, GAME_LIMIT_Y);
    ctx.lineTo(canvas.width, GAME_LIMIT_Y);
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    spawnTimerRef.current += deltaTime;
    const currentSpawnRate = Math.max(500, SPAWN_RATE_INITIAL - (difficultyRef.current * 100));
    if (spawnTimerRef.current > currentSpawnRate) {
      const spawnX = Math.random() * (canvas.width - SOCK_WIDTH) + SOCK_WIDTH / 2;
      socksRef.current.push(createSock(spawnX));
      spawnTimerRef.current = 0;
      difficultyRef.current += 0.1;
      if (!fallingSound.playing()) {
        fallingSound.play();
      }
    }
    const socksToRemove: string[] = [];
    let limitReached = false;
    socksRef.current.forEach(sock => {
      if (!sock.isDragging && !sock.isStacked) {
        sock.vy += (GRAVITY_INITIAL + (difficultyRef.current * 0.05)) * (deltaTime / 16);
        sock.y += sock.vy;
        sock.x += sock.vx;
      }
      if (sock.isDragging) {
        sock.vy = 0;
        sock.vx = 0;
        sock.isStacked = false;
      }
      if (sock.x < SOCK_WIDTH/2) sock.x = SOCK_WIDTH/2;
      if (sock.x > canvas.width - SOCK_WIDTH/2) sock.x = canvas.width - SOCK_WIDTH/2;
      const collision = checkCollisions(sock, socksRef.current, canvas.height);
      if (collision && collision.matched && collision.otherId) {
        socksToRemove.push(sock.id, collision.otherId);
        scoreRef.current += 100;
        onScoreUpdate(scoreRef.current);
        collisionSound.play();
        popSound.play();
        confetti({
          particleCount: 20,
          spread: 50,
          origin: { x: sock.x / canvas.width, y: sock.y / canvas.height },
          colors: [sock.color]
        });
      }
      if (sock.isStacked && sock.y < GAME_LIMIT_Y) {
        limitReached = true;
      }
    });
    if (socksToRemove.length > 0) {
      socksRef.current = socksRef.current.filter(s => !socksToRemove.includes(s.id));
      activeDragId.current = null;
    }
    socksRef.current.forEach(sock => drawSock(ctx, sock));
    if (limitReached && gameActive) {
      gameOverSound.play();
      onGameOver(scoreRef.current);
      return;
    }
    requestRef.current = requestAnimationFrame(update);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = socksRef.current.length - 1; i >= 0; i--) {
      const sock = socksRef.current[i];
      const dx = x - sock.x;
      const dy = y - sock.y;
      if (dx * dx + dy * dy < (SOCK_WIDTH * 1.5) * (SOCK_WIDTH * 1.5)) {
        activeDragId.current = sock.id;
        sock.isDragging = true;
        dragOffset.current = { x: dx, y: dy };
        socksRef.current.splice(i, 1);
        socksRef.current.push(sock);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeDragId.current || !gameActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const sock = socksRef.current.find(s => s.id === activeDragId.current);
    if (sock) {
      sock.x = x - dragOffset.current.x;
      sock.y = y - dragOffset.current.y;
    }
  };

  const handlePointerUp = () => {
    if (activeDragId.current) {
      const sock = socksRef.current.find(s => s.id === activeDragId.current);
      if (sock) {
        sock.isDragging = false;
        sock.isStacked = false;
      }
      activeDragId.current = null;
    }
  };

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (gameActive) {
      socksRef.current = [];
      scoreRef.current = 0;
      difficultyRef.current = 1;
      spawnTimerRef.current = 0;
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameActive]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
    />
  );
}
