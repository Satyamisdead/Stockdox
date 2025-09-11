

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gem, Heart, ShieldAlert, Play, Pause, ChevronsUp, ShieldHalf, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 450;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 7;
const BALL_SPEED_INITIAL = 4;
const BALL_SPEED_INCREMENT = 0.5; // Speed increase per level
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 4;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = (GAME_WIDTH - (BRICK_COLS * ((GAME_WIDTH - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS) + (BRICK_COLS - 1) * BRICK_GAP)) / 2;
const BRICK_WIDTH = (GAME_WIDTH - BRICK_OFFSET_LEFT * 2 - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS;
const POWERUP_CHANCE = 0.20; // 20% chance to drop a power-up
const POWERUP_SIZE = 15;
const POWERUP_SPEED = 2;


const INITIAL_LIVES = 3;

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  color: string;
  type: 'normal' | 'steel';
  hits: number;
  isFalling?: boolean;
  opacity?: number;
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'extraLife' | 'multiBall';
  active: boolean;
}

interface Ball {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  launched: boolean;
  color: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  opacity: number;
  id: number;
}

interface Cheerleader {
  id: string;
  x: number;
  y: number;
  text: string;
  opacity: number;
  animation: 'fade-in-out';
}

type GameState = "IDLE" | "PLAYING" | "PAUSED" | "GAME_OVER";

const brickColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];
const steelColor = "hsl(var(--muted-foreground))";
const steelHitColor = "hsl(var(--muted))";


let audioContext: AudioContext | null = null;
const playSound = (type: 'brick' | 'steelHit' | 'paddle' | 'wall' | 'loseLife' | 'levelUp' | 'powerUp') => {
  if (typeof window === 'undefined') return;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("AudioContext not supported");
      return;
    }
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

  switch(type) {
    case 'brick':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      break;
    case 'steelHit':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
      break;
    case 'paddle':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
      break;
    case 'wall':
       oscillator.type = 'sine';
       oscillator.frequency.setValueAtTime(110, audioContext.currentTime);
       gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
       break;
    case 'loseLife':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      break;
    case 'levelUp':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        const osc2 = audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, audioContext.currentTime); // G5
        osc2.connect(gainNode);
        osc2.start(audioContext.currentTime + 0.1);
        osc2.stop(audioContext.currentTime + 0.4);
        break;
    case 'powerUp':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        break;
  }

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

const Confetti = ({ particles }: { particles: ConfettiParticle[] }) => {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.opacity,
              transition: 'opacity 0.5s ease-out',
            }}
          />
        ))}
      </div>
    );
};

const createInitialBall = (level: number): Ball => ({
  id: `ball-${Date.now()}`,
  x: GAME_WIDTH / 2,
  y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5,
  dx: 0,
  dy: 0,
  speed: BALL_SPEED_INITIAL + (level - 1) * BALL_SPEED_INCREMENT,
  launched: false,
  color: "hsl(var(--destructive))",
});


export default function GamesPage() {
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const [balls, setBalls] = useState<Ball[]>([createInitialBall(1)]);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [dynamicScale, setDynamicScale] = useState(1);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);
  const [cheerleaders, setCheerleaders] = useState<Cheerleader[]>([]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameWrapperRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const gameStateRef = useRef(gameState);
  
  const cheerTexts = ["Great Shot!", "Awesome!", "Keep it up!", "You're on fire!", "Amazing!", "Super!"];

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const initializeBricks = useCallback((newLevel: number) => {
    const newBricks: Brick[] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const isSteel = newLevel > 2 && Math.random() < 0.2; // 20% chance for steel brick after level 2
        newBricks.push({
          x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_GAP),
          y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_GAP),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          active: true,
          color: isSteel ? steelColor : brickColors[r % brickColors.length],
          type: isSteel ? 'steel' : 'normal',
          hits: isSteel ? 2 : 1,
          opacity: 1,
        });
      }
    }
    setBricks(newBricks);
    setBalls(prev => prev.map(b => ({ ...b, speed: BALL_SPEED_INITIAL + (newLevel - 1) * BALL_SPEED_INCREMENT })));
  }, []);
  
  const triggerConfetti = () => {
    const newParticles: ConfettiParticle[] = [];
    for (let i = 0; i < 50; i++) {
        newParticles.push({
            id: Math.random(),
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2,
            dx: (Math.random() - 0.5) * 10,
            dy: (Math.random() - 0.5) * 15,
            color: brickColors[Math.floor(Math.random() * brickColors.length)],
            size: Math.random() * 5 + 3,
            opacity: 1,
        });
    }
    setConfettiParticles(newParticles);
  };
  
  const handleShowCheerleader = useCallback(() => {
    // Only show if random check passes AND no other cheerleaders are active.
    if (Math.random() > 0.1 || cheerleaders.length > 0) return;
    const id = Date.now().toString();
    const newCheer: Cheerleader = {
        id: id,
        x: Math.random() * (GAME_WIDTH - 150), // prevent going off-screen
        y: Math.random() * (GAME_HEIGHT / 2) + GAME_HEIGHT / 4,
        text: cheerTexts[Math.floor(Math.random() * cheerTexts.length)],
        opacity: 0,
        animation: 'fade-in-out'
    };
    setCheerleaders(prev => [...prev, newCheer]);

    setTimeout(() => {
        setCheerleaders(prev => prev.filter(c => c.id !== id));
    }, 6000);
  }, [cheerTexts, cheerleaders.length]);

  const launchBall = useCallback(() => {
    setBalls(prevBalls => {
      // Find the first unlaunched ball and launch it.
      const unlaunchedIndex = prevBalls.findIndex(ball => !ball.launched);
      if (unlaunchedIndex === -1) return prevBalls; // All balls are launched.

      return prevBalls.map((ball, index) => {
        if (index === unlaunchedIndex) {
          const randomAngle = (Math.random() * Math.PI / 2) + Math.PI / 4; // Launch between 45 and 135 degrees
          const speed = ball.speed;
          return {
            ...ball,
            dx: speed * Math.cos(randomAngle) * (Math.random() > 0.5 ? 1 : -1),
            dy: -speed * Math.sin(randomAngle),
            launched: true,
          };
        }
        return ball;
      });
    });
  }, []);

  const resetBallAndPaddle = useCallback((isNewLife: boolean) => {
    setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
    const newBall = createInitialBall(level);
    setBalls([newBall]);
    if (isNewLife && gameStateRef.current === "PLAYING") {
       setTimeout(() => {
            if (gameStateRef.current === 'PLAYING') {
                launchBall();
            }
        }, 500);
    }
  }, [level, launchBall]);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    initializeBricks(1);
    setPowerUps([]);
    setBalls([createInitialBall(1)]);
    setGameState("IDLE");
  }, [initializeBricks]);

  const handleLevelUp = useCallback(() => {
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      // Do not re-initialize bricks here. Leveling is purely score based.
      setBalls(prev => prev.map(b => ({ ...b, speed: BALL_SPEED_INITIAL + (newLevel - 1) * BALL_SPEED_INCREMENT })));
      playSound('levelUp');
      triggerConfetti();
      if (newLevel % 2 === 0) {
        setLives(prev => Math.min(5, prev + 1));
      }
    }
  }, [score, level]);
  

  const handleStartPause = () => {
    if (gameState === "IDLE" || gameState === "GAME_OVER") {
      if (gameState === "GAME_OVER") {
        resetGame();
        setGameState("PLAYING");
        if (!balls.some(b => b.launched)) {
           setTimeout(() => launchBall(), 500);
        }
      } else {
        setGameState("PLAYING");
        if (!balls.some(b => b.launched)) {
           setTimeout(() => launchBall(), 500);
        }
      }
    } else if (gameState === "PLAYING") {
      setGameState("PAUSED");
    } else if (gameState === "PAUSED") {
      setGameState("PLAYING");
    }
  };

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    const calculateScale = () => {
      if (gameWrapperRef.current) {
        const containerWidth = gameWrapperRef.current.offsetWidth;
        const newScale = Math.min(containerWidth / GAME_WIDTH, 1);
        setDynamicScale(newScale);
      }
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const handlePaddleMove = (value: number[]) => {
      if (gameState === "PAUSED" || gameState === "GAME_OVER") return;
      const newPaddleX = (value[0] / 100) * (GAME_WIDTH - PADDLE_WIDTH);
      setPaddleX(newPaddleX);

      // If a ball is not launched, move it with the paddle
       if (balls.some(b => !b.launched)) {
            setBalls(prevBalls => prevBalls.map(ball => {
                if (!ball.launched) {
                    return { ...ball, x: newPaddleX + PADDLE_WIDTH / 2 };
                }
                return ball;
            }));
        }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        handleStartPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, balls]);

  useEffect(() => {
    if (gameState !== "PLAYING") {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
      return;
    }

    let localBalls = balls;
    let localBricks = bricks;
    let localPowerUps = powerUps;
    let localLives = lives;

    const gameLoop = () => {
      if (gameStateRef.current !== "PLAYING") {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        return;
      }
      
      handleLevelUp();

      setConfettiParticles(prev => prev.map(p => ({
            ...p,
            x: p.x + p.dx,
            y: p.y + p.dy + 0.2, // gravity
            opacity: p.opacity - 0.01,
        })).filter(p => p.opacity > 0)
      );

      setCheerleaders(prev => prev.map((c) => ({ ...c, opacity: Math.min(1, c.opacity + 0.05) })));
      
      let paddleHitByFallingBrick = false;
      const updatedBricksAndPowerUps = () => {
        let nextBricks = [...localBricks];
        let nextPowerUps = [...localPowerUps];

        // Animate brick fading
        nextBricks = nextBricks.map(brick => {
           if (brick.opacity !== undefined && brick.opacity < 1) {
             const newOpacity = brick.opacity - 0.05;
             if (newOpacity <= 0) return { ...brick, active: false };
             return { ...brick, opacity: newOpacity };
           }
           return brick;
        });

        nextBricks = nextBricks.map(brick => {
            if (brick.isFalling) {
            const newY = brick.y + 2;
            if (
                newY + BRICK_HEIGHT > GAME_HEIGHT - PADDLE_HEIGHT &&
                newY < GAME_HEIGHT &&
                brick.x + BRICK_WIDTH > paddleX &&
                brick.x < paddleX + PADDLE_WIDTH
            ) {
                paddleHitByFallingBrick = true;
                return { ...brick, active: false, isFalling: false };
            }
            if (newY > GAME_HEIGHT) {
                return { ...brick, active: false, isFalling: false };
            }
            return { ...brick, y: newY };
            }
            return brick;
        }).filter(b => b.active);

        nextPowerUps = nextPowerUps.map(p => {
          if (p.active) {
              const newY = p.y + POWERUP_SPEED;
              if (
                  newY + POWERUP_SIZE > GAME_HEIGHT - PADDLE_HEIGHT &&
                  newY < GAME_HEIGHT &&
                  p.x + POWERUP_SIZE > paddleX &&
                  p.x < paddleX + PADDLE_WIDTH
              ) {
                  playSound('powerUp');
                  if (p.type === 'extraLife') {
                      setLives(l => Math.min(5, l + 1));
                  } else if (p.type === 'multiBall') {
                      setBalls(prevBalls => {
                          if (prevBalls.length >= 3) return prevBalls;
                          const activeBall = prevBalls.find(b => b.launched);
                          if (!activeBall) return prevBalls;

                          const newBall: Ball = {
                            ...activeBall,
                            id: `ball-${Date.now()}-${Math.random()}`,
                            dx: -activeBall.dx,
                            color: 'hsl(var(--chart-2))',
                          };
                          
                          return [...prevBalls, newBall];
                      });
                  }
                  return { ...p, active: false };
              }
              if (newY > GAME_HEIGHT) return { ...p, active: false };
              return { ...p, y: newY };
          }
          return p;
        }).filter(p => p.active);

        setBricks(nextBricks);
        setPowerUps(nextPowerUps);
        localBricks = nextBricks;
        localPowerUps = nextPowerUps;
      };
      updatedBricksAndPowerUps();


      if (paddleHitByFallingBrick) {
         playSound('loseLife');
         const newLives = localLives -1;
         setLives(newLives);
         localLives = newLives;
         if (newLives <= 0) {
            setGameState("GAME_OVER");
            return;
         }
      }
      
      let nextBalls = [...localBalls];
      if (!nextBalls.some(b => b.launched)) {
          // This ensures the un-launched ball stays on the paddle
          setBalls(currentBalls => {
              return currentBalls.map(b => b.launched ? b : { ...b, x: paddleX + PADDLE_WIDTH / 2 });
          });
          animationFrameId.current = requestAnimationFrame(gameLoop);
          return;
      }
      
      let remainingBalls: Ball[] = [];
      nextBalls.forEach(ball => {
          if (!ball.launched) {
            remainingBalls.push({ ...ball, x: paddleX + PADDLE_WIDTH / 2 });
            return;
          }

          let newX = ball.x + ball.dx;
          let newY = ball.y + ball.dy;
          let newDx = ball.dx;
          let newDy = ball.dy;
          
          if (newX + BALL_RADIUS > GAME_WIDTH || newX - BALL_RADIUS < 0) { newDx = -newDx; playSound('wall'); }
          if (newY - BALL_RADIUS < 0) { newDy = -newDy; playSound('wall'); }

          if ( newY + BALL_RADIUS > GAME_HEIGHT - PADDLE_HEIGHT && newY + BALL_RADIUS < GAME_HEIGHT && newX + BALL_RADIUS > paddleX && newX - BALL_RADIUS < paddleX + PADDLE_WIDTH && newDy > 0 ) {
            newDy = -Math.abs(newDy);
            newY = GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 1;
            let hitPos = (newX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
            newDx = hitPos * ball.speed * 1.2;
            playSound('paddle');
          }

          let bricksBrokenThisFrame = 0;
          let allBricksCleared = true;
          let nextFrameBricks = [...localBricks];

          for (let i = 0; i < nextFrameBricks.length; i++) {
            let brick = nextFrameBricks[i];
            if (brick.active && brick.opacity === 1 && !brick.isFalling && bricksBrokenThisFrame < 2) {
              if ( newX + BALL_RADIUS > brick.x && newX - BALL_RADIUS < brick.x + brick.width && newY + BALL_RADIUS > brick.y && newY - BALL_RADIUS < brick.y + brick.height ) {
                const ballBottom = newY + BALL_RADIUS, ballTop = newY - BALL_RADIUS;
                const prevBallBottom = ball.y + BALL_RADIUS, prevBallTop = ball.y - BALL_RADIUS;
                const brickTop = brick.y, brickBottom = brick.y + brick.height;
                
                if (prevBallBottom <= brickTop && ballBottom > brickTop) { newDy = -Math.abs(newDy); newY = brick.y - BALL_RADIUS; } 
                else if (prevBallTop >= brickBottom && ballTop < brickBottom) { newDy = Math.abs(newDy); newY = brick.y + brick.height + BALL_RADIUS; }
                else { newDx = -newDx; newX = ball.x; }
                
                brick.hits -= 1;
                bricksBrokenThisFrame++;

                if (brick.hits <= 0) {
                    brick.opacity = 0.99; // Start fade out
                    setScore(s => s + (brick.type === 'steel' ? 25 : 10));
                    playSound('brick');
                    handleShowCheerleader();
                    
                    if (Math.random() < POWERUP_CHANCE) {
                      setPowerUps(prev => {
                          const powerUpType = Math.random() > 0.65 ? 'extraLife' : 'multiBall'; // More chance for multi-ball
                          const newPowerUp = { id: `${Date.now()}-${i}-${Math.random()}`, x: brick.x + BRICK_WIDTH / 2 - POWERUP_SIZE / 2, y: brick.y, type: powerUpType, active: true };
                          return [...prev, newPowerUp];
                      });
                    }
                } else {
                    brick.isFalling = true;
                    brick.color = steelHitColor;
                    playSound('steelHit');
                }
              }
            }
             if (brick.active) {
                allBricksCleared = false;
            }
          }
          if(bricksBrokenThisFrame > 0) {
             setBricks(nextFrameBricks);
             localBricks = nextFrameBricks;
          }
          
          if (allBricksCleared && bricks.some(b => b.active)) {
               initializeBricks(level + 1);
               setLevel(l => l + 1);
               setLives(l => l + 1);
               resetBallAndPaddle(true);
          }
          
          if (newY - BALL_RADIUS < GAME_HEIGHT) {
            remainingBalls.push({ ...ball, x: newX, y: newY, dx: newDx, dy: newDy });
          }
      });
      
      // Check if any balls were lost this frame
      if (localBalls.length > 0 && remainingBalls.length < localBalls.length) {
          if (remainingBalls.length === 0) { // Last ball was lost
            playSound('loseLife');
            const newLives = localLives - 1;
            setLives(newLives);
            localLives = newLives;

            if (newLives <= 0) {
              setGameState("GAME_OVER");
              setBalls([]);
              return;
            } else {
              resetBallAndPaddle(true);
            }
          } else { // Some balls remain
             setBalls(remainingBalls);
             localBalls = remainingBalls;
          }
      } else {
         setBalls(remainingBalls);
         localBalls = remainingBalls;
      }
      
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    if(!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, paddleX, balls, bricks, powerUps, lives, score, level, handleLevelUp, resetBallAndPaddle, launchBall, initializeBricks, handleShowCheerleader]);

  const getButtonText = () => {
    if (gameState === "PLAYING") return "Pause";
    if (gameState === "PAUSED") return "Resume";
    if (gameState === "GAME_OVER") return "Replay";
    return "Start";
  };
  
  const getButtonIcon = () => {
    if (gameState === "PLAYING") return <Pause className="w-5 h-5 sm:w-6 sm:h-6 mr-0 sm:mr-2"/>;
    return <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-0 sm:mr-2"/>;
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 space-y-4">
      <Card className="w-full max-w-[640px] shadow-xl bg-card border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl sm:text-2xl font-headline text-primary">Brick Breaker</CardTitle>
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
             <div className="flex items-center text-foreground">
                <ChevronsUp className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> Level: {level}
            </div>
            <div className="flex items-center text-foreground">
                <Gem className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4 text-primary" /> Score: {score}
            </div>
            <div className="flex items-center text-foreground">
                <Heart className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4 text-red-500" /> Lives: {lives}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 py-2 sm:p-4">
          <div 
            ref={gameWrapperRef}
            className="w-full mx-auto"
            style={{ 
              maxWidth: GAME_WIDTH, 
              height: GAME_HEIGHT * dynamicScale 
            }}
          >
            <div
              ref={gameAreaRef}
              className="relative bg-muted/30 rounded-md overflow-hidden border-2 border-primary select-none"
              style={{
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                transform: `scale(${dynamicScale})`,
                transformOrigin: 'top left',
              }}
            >
              <div
                className="absolute bg-primary rounded"
                style={{
                  left: paddleX,
                  bottom: 0,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                  boxShadow: '0 0 10px hsl(var(--primary))'
                }}
              />

              {balls.map(ball => (
                <div
                  key={ball.id}
                  className="absolute rounded-full"
                  style={{
                    left: ball.x - BALL_RADIUS,
                    top: ball.y - BALL_RADIUS,
                    width: BALL_RADIUS * 2,
                    height: BALL_RADIUS * 2,
                    backgroundColor: ball.color,
                    boxShadow: `0 0 12px ${ball.color}`
                  }}
                />
              ))}


              {bricks.map((brick, index) =>
                ( brick.active &&
                  <div
                    key={index}
                    className="absolute rounded shadow-sm"
                    style={{
                      left: brick.x,
                      top: brick.y,
                      width: brick.width,
                      height: brick.height,
                      backgroundColor: brick.color,
                      border: '1px solid hsl(var(--background)/0.5)',
                      opacity: brick.opacity,
                      transition: 'opacity 0.3s ease-out, background-color 0.1s ease-in',
                    }}
                  >
                   {brick.type === 'steel' && brick.hits === 1 && (
                       <ShieldHalf className="w-full h-full text-background/30 p-1" />
                   )}
                  </div>
                )
              )}

              {powerUps.map((p) => (
                p.active && (
                  <div key={p.id} className="absolute" style={{left: p.x, top: p.y}}>
                     {p.type === 'extraLife' && <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse"/>}
                     {p.type === 'multiBall' && <PlusCircle className="w-5 h-5 text-blue-500 fill-blue-500 animate-pulse"/>}
                  </div>
                )
              ))}

              {cheerleaders.map((cheer) => (
                  <div key={cheer.id} 
                       className="absolute p-2 bg-primary/80 text-primary-foreground rounded-lg shadow-lg text-center"
                       style={{ 
                         left: cheer.x,
                         top: cheer.y,
                         opacity: cheer.opacity,
                         transition: 'opacity 3s ease-in-out',
                         animation: 'fade-in-out 6s ease-in-out forwards',
                       }}
                   >
                     <p className="font-bold text-sm">🎉 {cheer.text} 🎉</p>
                  </div>
              ))}
              
              <Confetti particles={confettiParticles} />

              {(gameState === "IDLE") && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 animate-fade-in">
                      <h2 className="text-2xl font-bold mb-2 text-white">Level {level}</h2>
                      <p className="text-lg text-white">Press Start</p>
                  </div>
              )}
               {gameState === "PAUSED" && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 animate-fade-in">
                      <p className="text-2xl font-bold">Paused</p>
                  </div>
              )}
               {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 animate-fade-in">
                  <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-3 sm:mb-4 animate-bounce"/>
                  <p className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-white">Game Over!</p>
                  <p className="text-md sm:text-xl mb-3 sm:mb-4 text-white">Final Score: {score}</p>
                  <Button onClick={handleStartPause} variant="default" size="lg">Replay</Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-sm px-4 flex items-center gap-4">
        <Slider
            defaultValue={[50]}
            max={100}
            step={1}
            onValueChange={handlePaddleMove}
            value={[(paddleX / (GAME_WIDTH - PADDLE_WIDTH)) * 100]}
            disabled={gameState === "GAME_OVER"}
            className="w-full"
            aria-label="Move Paddle"
        />
        <Button 
          onClick={handleStartPause}
          aria-label={getButtonText()}
          variant="default" 
          className="p-3 sm:p-4 text-sm sm:text-base h-auto w-32"
          disabled={false}
        >
          {getButtonIcon()} <span className="hidden sm:inline">{getButtonText()}</span>
        </Button>
      </div>

      <div className="text-center text-muted-foreground text-xs sm:text-sm max-w-md px-4 mt-2">
        <p>Use slider to control the paddle.</p>
      </div>
      
      <div className="w-full max-w-sm px-4 pt-8">
        <div className="relative rounded-lg border-2 border-dashed border-border p-4 flex items-center justify-center">
            <span className="font-semibold text-lg text-muted-foreground">More Games Coming Soon!</span>
        </div>
      </div>
    </div>
  );
}
