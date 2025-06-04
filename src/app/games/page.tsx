
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, CircleDot, Gem, Heart, ShieldAlert, Trophy } from 'lucide-react';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 450; // Increased height slightly for more play area
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 25;
const BALL_RADIUS = 7;
const BALL_SPEED_INITIAL = 4;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 4;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = (GAME_WIDTH - (BRICK_COLS * ((GAME_WIDTH - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS) + (BRICK_COLS - 1) * BRICK_GAP)) / 2; // Center bricks
const BRICK_WIDTH = (GAME_WIDTH - BRICK_OFFSET_LEFT * 2 - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS;

const INITIAL_LIVES = 3;

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  color: string; // Added color property for bricks
}

type GameState = "IDLE" | "PLAYING" | "GAME_OVER" | "LEVEL_CLEAR";

const brickColors = [
  "hsl(var(--chart-1))", // Yellowish
  "hsl(var(--chart-2))", // Blue
  "hsl(var(--chart-3))", // Green
  "hsl(var(--chart-4))", // Purple
  "hsl(var(--chart-5))", // Reddish Orange
];

export default function GamesPage() {
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5,
    dx: 0, // Ball starts stationary
    dy: 0,
    launched: false,
  });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gameState, setGameState] = useState<GameState>("IDLE");

  const gameAreaRef = useRef<HTMLDivElement>(null);
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
          color: brickColors[r % brickColors.length], // Cycle through colors per row
        });
      }
    }
    setBricks(newBricks);
  }, []);

  const resetBallAndPaddle = useCallback(() => {
    setPaddleX((GAME_WIDTH - PADDLE_WIDTH) / 2);
    setBall({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5,
      dx: 0,
      dy: 0,
      launched: false,
    });
  }, []);

  const startGame = useCallback(() => {
    initializeBricks();
    setScore(0);
    setLives(INITIAL_LIVES);
    resetBallAndPaddle();
    setGameState("PLAYING");
  }, [initializeBricks, resetBallAndPaddle]);

  const launchBall = useCallback(() => {
    if (gameState === "PLAYING" && !ball.launched) {
      // Random initial direction for variety, but always upwards
      const randomAngle = (Math.random() * Math.PI / 2) + Math.PI / 4; // Between 45 and 135 degrees upwards
      setBall(prev => ({
        ...prev,
        dx: BALL_SPEED_INITIAL * Math.cos(randomAngle - Math.PI/2), // Adjust angle for coordinate system
        dy: -BALL_SPEED_INITIAL * Math.sin(randomAngle - Math.PI/2), // Negative dy for upward movement
        launched: true,
      }));
    }
  }, [ball.launched, gameState]);

  useEffect(() => {
    startGame(); // Initialize game on mount
  }, [startGame]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "PLAYING") return;

      if (e.key === "ArrowLeft") {
        setPaddleX(prev => Math.max(0, prev - PADDLE_SPEED));
      } else if (e.key === "ArrowRight") {
        setPaddleX(prev => Math.min(GAME_WIDTH - PADDLE_WIDTH, prev + PADDLE_SPEED));
      } else if (e.key === " " && !ball.launched) { // Space to launch
        e.preventDefault(); // Prevent page scroll
        launchBall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, ball.launched, launchBall]);


  useEffect(() => {
    if (gameState !== "PLAYING") {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    const gameLoop = () => {
      setBall(prevBall => {
        if (!prevBall.launched) {
          // Ball stays on paddle if not launched
          return { ...prevBall, x: paddleX + PADDLE_WIDTH / 2 };
        }

        let newX = prevBall.x + prevBall.dx;
        let newY = prevBall.y + prevBall.dy;
        let newDx = prevBall.dx;
        let newDy = prevBall.dy;

        // Wall collision
        if (newX + BALL_RADIUS > GAME_WIDTH || newX - BALL_RADIUS < 0) {
          newDx = -newDx;
          newX = prevBall.x; // Prevent sticking
        }
        if (newY - BALL_RADIUS < 0) {
          newDy = -newDy;
          newY = prevBall.y; // Prevent sticking
        }

        // Paddle collision
        if (
          newY + BALL_RADIUS > GAME_HEIGHT - PADDLE_HEIGHT &&
          newY - BALL_RADIUS < GAME_HEIGHT && // Ensure ball is not way past paddle
          newX > paddleX &&
          newX < paddleX + PADDLE_WIDTH
        ) {
          newDy = -Math.abs(newDy); // Ensure it always bounces up
          newY = GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 1; // Place ball on top of paddle

          // Add slight angle based on where it hits the paddle
          let hitPos = (newX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2); // -1 to 1
          newDx = hitPos * BALL_SPEED_INITIAL * 0.8; // Max change dx based on hit pos
        }


        // Brick collision
        let newScore = score;
        const newBricks = bricks.map(brick => {
          if (brick.active) {
            if (
              newX + BALL_RADIUS > brick.x &&
              newX - BALL_RADIUS < brick.x + brick.width &&
              newY + BALL_RADIUS > brick.y &&
              newY - BALL_RADIUS < brick.y + brick.height
            ) {
              newDy = -newDy; // Simple bounce
              newScore += 10;
              return { ...brick, active: false };
            }
          }
          return brick;
        });
        setBricks(newBricks);
        if (newScore !== score) setScore(newScore);


        // Bottom wall / Lose life
        if (newY + BALL_RADIUS > GAME_HEIGHT) {
          setLives(prevLives => {
            const currentLives = prevLives - 1;
            if (currentLives <= 0) {
              setGameState("GAME_OVER");
              return 0;
            } else {
              resetBallAndPaddle(); // Reset ball for next life
              return currentLives;
            }
          });
          return { ...prevBall, x: paddleX + PADDLE_WIDTH / 2, y: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5, dx: 0, dy: 0, launched: false };
        }
        
        return { ...prevBall, x: newX, y: newY, dx: newDx, dy: newDy };
      });

      // Check for level clear
      if (bricks.every(b => !b.active) && bricks.length > 0) {
        setGameState("LEVEL_CLEAR");
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    if (ball.launched || gameState === "PLAYING") {
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, paddleX, bricks, score, resetBallAndPaddle, ball.launched]);


  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-6">
      <Card className="w-full max-w-[640px] shadow-xl bg-card border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-headline text-primary">Brick Breaker</CardTitle>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-foreground">
                <Gem className="mr-1.5 h-4 w-4 text-primary" /> Score: {score}
            </div>
            <div className="flex items-center text-foreground">
                <Heart className="mr-1.5 h-4 w-4 text-red-500" /> Lives: {lives}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={gameAreaRef}
            className="relative bg-muted/30 rounded-md overflow-hidden border-2 border-primary"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Paddle */}
            <div
              className="absolute bg-primary rounded"
              style={{
                left: paddleX,
                bottom: 0,
                width: PADDLE_WIDTH,
                height: PADDLE_HEIGHT,
                boxShadow: '0 -2px 5px hsl(var(--primary)/0.5)',
              }}
            />

            {/* Ball */}
            { (gameState === "PLAYING" || gameState === "IDLE" || gameState === "GAME_OVER") && // Show ball unless level clear
                <div
                  className="absolute bg-accent rounded-full shadow-md"
                  style={{
                    left: ball.x - BALL_RADIUS,
                    top: ball.y - BALL_RADIUS,
                    width: BALL_RADIUS * 2,
                    height: BALL_RADIUS * 2,
                  }}
                />
            }

            {/* Bricks */}
            {bricks.map((brick, index) =>
              brick.active ? (
                <div
                  key={index}
                  className="absolute rounded shadow"
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

            {/* Game Messages */}
            {gameState === "IDLE" && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-background">
                    <CircleDot className="w-16 h-16 text-primary mb-4"/>
                    <p className="text-2xl font-bold mb-2">Press SPACE to Launch Ball</p>
                    <p className="text-sm">(Use Left/Right Arrows to Move Paddle)</p>
                </div>
            )}
             {gameState === "GAME_OVER" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-background">
                <ShieldAlert className="w-16 h-16 text-destructive mb-4"/>
                <p className="text-3xl font-bold mb-2">Game Over!</p>
                <p className="text-xl mb-4">Final Score: {score}</p>
                <Button onClick={startGame} variant="default" size="lg">Restart Game</Button>
              </div>
            )}
            {gameState === "LEVEL_CLEAR" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-primary-foreground">
                 <Trophy className="w-16 h-16 text-primary mb-4"/>
                <p className="text-3xl font-bold mb-2">You Win!</p>
                <p className="text-xl mb-4">Final Score: {score}</p>
                <Button onClick={startGame} variant="default" size="lg">Play Again</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="text-center text-muted-foreground text-sm max-w-md">
        <p><ArrowLeftRight className="inline h-4 w-4 mr-1"/> Use <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Arrow Keys</kbd> to move the paddle.</p>
        <p className="mt-1"><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Spacebar</kbd> to launch the ball.</p>
      </div>
    </div>
  );
}

    