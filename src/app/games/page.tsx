
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gem, Heart, ShieldAlert, Trophy, Play, Pause, ChevronsUp } from 'lucide-react';

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

type GameState = "IDLE" | "PLAYING" | "PAUSED" | "GAME_OVER" | "LEVEL_CLEAR";

const brickColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Audio Context for sound effects
let audioContext: AudioContext | null = null;
const playSound = (type: 'brick' | 'paddle' | 'wall' | 'loseLife') => {
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
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      break;
    case 'paddle':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
      break;
    case 'wall':
       oscillator.type = 'sine';
       oscillator.frequency.setValueAtTime(110, audioContext.currentTime); // A2
       gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
       break;
    case 'loseLife':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      break;
  }

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
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

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameWrapperRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const initializeBricks = useCallback(() => {
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
  }, []);

  const resetBallAndPaddle = useCallback((isNewLevel = false) => {
    setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
    setBall(prev => ({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5,
      dx: 0,
      dy: 0,
      speed: isNewLevel ? prev.speed + BALL_SPEED_INCREMENT : BALL_SPEED_INITIAL,
      launched: false,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setLives(INITIAL_LIVES);
    initializeBricks();
    resetBallAndPaddle();
    setGameState("IDLE");
  }, [initializeBricks, resetBallAndPaddle]);

  const handleLevelClear = useCallback(() => {
      setLevel(prev => prev + 1);
      setLives(prev => Math.min(INITIAL_LIVES + 2, prev + 1)); // Bonus life for clearing level, max 5
      initializeBricks();
      resetBallAndPaddle(true);
      setGameState("IDLE");
  }, [initializeBricks, resetBallAndPaddle]);
  
  const launchBall = useCallback(() => {
      setBall(prev => {
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
      setGameState("PLAYING");
      if (!ball.launched) {
        // Delay launch slightly to allow state to update
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
      if (e.key === " " && (gameState === "IDLE" || gameState === "PLAYING" || gameState === "PAUSED")) {
        e.preventDefault();
        handleStartPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, ball.launched]);


  useEffect(() => {
    if (gameState !== "PLAYING") {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    const gameLoop = () => {
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
          newX - BALL_RADIUS < paddleX + PADDLE_WIDTH
        ) {
          newDy = -Math.abs(newDy);
          newY = GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 1;
          let hitPos = (newX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
          newDx = hitPos * prevBall.speed * 1.2;
          playSound('paddle');
        }

        // Brick collision
        let newScore = score;
        const newBricks = bricks.map(brick => {
          if (brick.active) {
            // Check for collision
            if (
              newX + BALL_RADIUS > brick.x &&
              newX - BALL_RADIUS < brick.x + brick.width &&
              newY + BALL_RADIUS > brick.y &&
              newY - BALL_RADIUS < brick.y + brick.height
            ) {
              newDy = -newDy;
              newScore += 10 * level;
              playSound('brick');
              return { ...brick, active: false };
            }
          }
          return brick;
        });
        
        if (newScore !== score) setScore(newScore);
        
        const activeBricksChanged = newBricks.some((b, i) => b.active !== bricks[i].active);
        if (activeBricksChanged) {
          setBricks(newBricks);
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
              setGameState("IDLE");
              resetBallAndPaddle();
              return currentLives;
            }
          });
          // Important: Reset ball state for the next turn
          return { ...prevBall, x: paddleX + PADDLE_WIDTH / 2, y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5, dx: 0, dy: 0, launched: false };
        }
        
        return { ...prevBall, x: newX, y: newY, dx: newDx, dy: newDy };
      });

      if (bricks.length > 0 && bricks.every(b => !b.active) && gameState === "PLAYING") {
        setGameState("LEVEL_CLEAR");
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, paddleX, bricks, score, resetBallAndPaddle, ball.launched, level, launchBall]);


  useEffect(() => {
    if (gameState === "LEVEL_CLEAR") {
        const timer = setTimeout(() => {
            handleLevelClear();
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [gameState, handleLevelClear]);

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
          <CardTitle className="text-xl sm:text-2xl font-headline text-primary">Take a Break</CardTitle>
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

              { (gameState !== "LEVEL_CLEAR") &&
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
              }

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

              {gameState === "IDLE" && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-background p-4 animate-fade-in">
                      <h2 className="text-2xl font-bold mb-2">Level {level}</h2>
                      <p className="text-lg">Press Start</p>
                  </div>
              )}
               {gameState === "PAUSED" && (
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
              {gameState === "LEVEL_CLEAR" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-primary-foreground p-4 animate-fade-in">
                   <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-primary mb-3 sm:mb-4 animate-bounce"/>
                  <p className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Level {level} Cleared!</p>
                  <p className="text-md sm:text-xl">Next level loading...</p>
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
          onClick={gameState === 'GAME_OVER' ? resetGame : handleStartPause} 
          aria-label={getButtonText()}
          variant="default" 
          className="p-3 sm:p-4 text-sm sm:text-base h-auto w-32"
          disabled={gameState === "LEVEL_CLEAR"}
        >
          {getButtonIcon()} <span className="hidden sm:inline">{getButtonText()}</span>
        </Button>
      </div>

      <div className="text-center text-muted-foreground text-xs sm:text-sm max-w-md px-4 mt-2">
        <p>Use the slider to control the paddle.</p>
        <p className="mt-1">Press <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Spacebar</kbd> or the button to start/pause.</p>
      </div>
    </div>
  );
}

    