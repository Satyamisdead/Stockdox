
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gem, Heart, ShieldAlert, Play, Pause, ChevronsUp } from 'lucide-react';

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

const INITIAL_LIVES = 3;

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
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

type GameState = "IDLE" | "PLAYING" | "PAUSED" | "GAME_OVER";

const brickColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

let audioContext: AudioContext | null = null;
const playSound = (type: 'brick' | 'paddle' | 'wall' | 'loseLife' | 'levelUp') => {
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

export default function GamesPage() {
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5,
    dx: 0,
    dy: 0,
    speed: BALL_SPEED_INITIAL,
    launched: false,
  });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [dynamicScale, setDynamicScale] = useState(1);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameWrapperRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const initializeBricks = useCallback((resetLevel = false) => {
    const newBricks: Brick[] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        newBricks.push({
          x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_GAP),
          y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_GAP),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          active: true,
          color: brickColors[r % brickColors.length],
        });
      }
    }
    setBricks(newBricks);
    if(resetLevel) {
       setLevel(1);
    }
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

  const handleLevelUp = useCallback(() => {
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      setBall(prev => ({
        ...prev,
        speed: BALL_SPEED_INITIAL + (newLevel - 1) * BALL_SPEED_INCREMENT
      }));
      playSound('levelUp');
      triggerConfetti();
      // Give a bonus life every 2 levels
      if (newLevel % 2 === 0) {
        setLives(prev => Math.min(5, prev + 1));
      }
    }
  }, [score, level]);


  const resetBallAndPaddle = useCallback(() => {
    setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
    setBall(prev => ({
      ...prev,
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5,
      dx: 0,
      dy: 0,
      launched: false,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState("IDLE");
    setScore(0);
    setLives(INITIAL_LIVES);
    initializeBricks(true);
    resetBallAndPaddle();
    setBall(prev => ({...prev, speed: BALL_SPEED_INITIAL}));
  }, [initializeBricks, resetBallAndPaddle]);
  
  const launchBall = useCallback(() => {
      setBall(prev => {
        if(prev.launched) return prev;
        const randomAngle = (Math.random() * Math.PI / 2) + Math.PI / 4;
        const speed = prev.speed;
        return {
          ...prev,
          dx: speed * Math.cos(randomAngle) * (Math.random() > 0.5 ? 1 : -1),
          dy: -speed * Math.sin(randomAngle),
          launched: true,
        };
      });
  }, []);

  const handleStartPause = () => {
    if (gameState === "IDLE" || gameState === "GAME_OVER") {
      if (gameState === "GAME_OVER") {
        resetGame();
      }
      setGameState("PLAYING");
      if (!ball.launched) {
        setTimeout(() => launchBall(), 100);
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
  }, [handleStartPause]);


  useEffect(() => {
    if (gameState !== "PLAYING") {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    let localBricks = bricks;

    const gameLoop = () => {
      handleLevelUp();

      // Update confetti
      setConfettiParticles(prev => prev.map(p => ({
            ...p,
            x: p.x + p.dx,
            y: p.y + p.dy + 0.2, // gravity
            opacity: p.opacity - 0.01,
        })).filter(p => p.opacity > 0)
      );

      setBall(prevBall => {
        if (!prevBall.launched) {
          return { ...prevBall, x: paddleX + PADDLE_WIDTH / 2 };
        }

        let newX = prevBall.x + prevBall.dx;
        let newY = prevBall.y + prevBall.dy;
        let newDx = prevBall.dx;
        let newDy = prevBall.dy;
        
        // Wall collision
        if (newX + BALL_RADIUS > GAME_WIDTH || newX - BALL_RADIUS < 0) {
          newDx = -newDx;
          playSound('wall');
        }
        if (newY - BALL_RADIUS < 0) {
          newDy = -newDy;
          playSound('wall');
        }

        // Paddle collision
        if (
          newY + BALL_RADIUS > GAME_HEIGHT - PADDLE_HEIGHT &&
          newY + BALL_RADIUS < GAME_HEIGHT &&
          newX + BALL_RADIUS > paddleX &&
          newX - BALL_RADIUS < paddleX + PADDLE_WIDTH &&
          newDy > 0
        ) {
          newDy = -Math.abs(newDy);
          newY = GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 1;
          let hitPos = (newX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
          newDx = hitPos * prevBall.speed * 1.2;
          playSound('paddle');
        }

        // Brick collision
        let bricksBroken = false;
        const newBricks = localBricks.map(brick => {
          if (brick.active) {
            if (
              newX + BALL_RADIUS > brick.x &&
              newX - BALL_RADIUS < brick.x + brick.width &&
              newY + BALL_RADIUS > brick.y &&
              newY - BALL_RADIUS < brick.y + brick.height
            ) {
              // Collision logic
              const ballBottom = newY + BALL_RADIUS;
              const ballTop = newY - BALL_RADIUS;
              
              const prevBallBottom = prevBall.y + BALL_RADIUS;
              const prevBallTop = prevBall.y - BALL_RADIUS;

              const brickTop = brick.y;
              const brickBottom = brick.y + brick.height;
              
              if (prevBallBottom <= brickTop && ballBottom > brickTop) {
                  newDy = -Math.abs(newDy); 
                  newY = brick.y - BALL_RADIUS;
              } 
              else if (prevBallTop >= brickBottom && ballTop < brickBottom) {
                  newDy = Math.abs(newDy); 
                  newY = brick.y + brick.height + BALL_RADIUS;
              }
              else {
                  newDx = -newDx;
                  newX = prevBall.x;
              }

              setScore(s => s + 10);
              playSound('brick');
              bricksBroken = true;
              return { ...brick, active: false };
            }
          }
          return brick;
        });
        
        if (bricksBroken) {
            localBricks = newBricks;
            setBricks(newBricks);
            // Check for level clear
            if (newBricks.every(b => !b.active)) {
                initializeBricks(false); // Reload bricks for the same level
                resetBallAndPaddle();
            }
        }
        
        // Lose life
        if (newY - BALL_RADIUS > GAME_HEIGHT) {
          playSound('loseLife');
          setLives(prevLives => {
            const currentLives = prevLives - 1;
            if (currentLives <= 0) {
              setGameState("GAME_OVER");
              return 0;
            } else {
              resetBallAndPaddle();
              return currentLives;
            }
          });
          return { ...prevBall, x: paddleX + PADDLE_WIDTH / 2, y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5, dx: 0, dy: 0, launched: false };
        }
        
        return { ...prevBall, x: newX, y: newY, dx: newDx, dy: newDy };
      });
      
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, paddleX, bricks, resetBallAndPaddle, launchBall, handleLevelUp, initializeBricks]);

  const getButtonText = () => {
    if (gameState === "PLAYING") return "Pause";
    if (gameState === "PAUSED") return "Resume";
    if (gameState === "GAME_OVER") return "Restart";
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
                <Gem className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 smw-4 text-primary" /> Score: {score}
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

              <div
                className="absolute bg-destructive rounded-full"
                style={{
                  left: ball.x - BALL_RADIUS,
                  top: ball.y - BALL_RADIUS,
                  width: BALL_RADIUS * 2,
                  height: BALL_RADIUS * 2,
                  boxShadow: '0 0 12px hsl(var(--destructive))'
                }}
              />

              {bricks.map((brick, index) =>
                brick.active ? (
                  <div
                    key={index}
                    className="absolute rounded shadow transition-opacity duration-300"
                    style={{
                      left: brick.x,
                      top: brick.y,
                      width: brick.width,
                      height: brick.height,
                      backgroundColor: brick.color,
                      border: '1px solid hsl(var(--background)/0.5)'
                    }}
                  />
                ) : null
              )}
              
              <Confetti particles={confettiParticles} />

              {(gameState === "IDLE" || gameState === "PAUSED") && !ball.launched && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-background p-4 animate-fade-in">
                      <h2 className="text-2xl font-bold mb-2">Level {level}</h2>
                      <p className="text-lg">Press Start</p>
                  </div>
              )}
               {gameState === "PAUSED" && ball.launched && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-background p-4 animate-fade-in">
                      <p className="text-2xl font-bold">Paused</p>
                  </div>
              )}
               {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-background p-4 animate-fade-in">
                  <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-3 sm:mb-4 animate-bounce"/>
                  <p className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Game Over!</p>
                  <p className="text-md sm:text-xl mb-3 sm:mb-4">Final Score: {score}</p>
                  <Button onClick={resetGame} variant="default" size="lg">Restart</Button>
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
        >
          {getButtonIcon()} <span className="hidden sm:inline">{getButtonText()}</span>
        </Button>
      </div>

      <div className="text-center text-muted-foreground text-xs sm:text-sm max-w-md px-4 mt-2">
        <p>Use the slider to control the paddle. Press spacebar to start/pause.</p>
      </div>
      
      <div className="w-full max-w-sm px-4 pt-8">
        <div className="relative rounded-lg border-2 border-dashed border-border p-4 flex items-center justify-center">
            <span className="font-semibold text-lg text-muted-foreground">More Games Coming Soon!</span>
        </div>
      </div>
    </div>
  );
}

    