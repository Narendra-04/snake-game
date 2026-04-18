import { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 150;

type Point = { x: number; y: number };

type GameState = {
  snake: Point[];
  food: Point;
  score: number;
};

export default function SnakeGame() {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: { x: 5, y: 5 },
    score: 0
  });

  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState<boolean>(true);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const directionRef = useRef(direction);
  const nextDirectionRef = useRef(direction);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    let isOccupied = true;
    while (isOccupied) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      isOccupied = currentSnake.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
    }
    return newFood!;
  }, []);

  const startGame = () => {
    const startSnake = INITIAL_SNAKE;
    setGameState({
      snake: startSnake,
      food: generateFood(startSnake),
      score: 0
    });
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    setIsGameOver(false);
    setHasStarted(true);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && !isGameOver) {
        setIsPaused(prev => !prev);
        return;
      }

      const currentDir = directionRef.current;
      if (e.key === 'ArrowUp' && currentDir.y !== 1) {
        nextDirectionRef.current = { x: 0, y: -1 };
      }
      if (e.key === 'ArrowDown' && currentDir.y !== -1) {
        nextDirectionRef.current = { x: 0, y: 1 };
      }
      if (e.key === 'ArrowLeft' && currentDir.x !== 1) {
        nextDirectionRef.current = { x: -1, y: 0 };
      }
      if (e.key === 'ArrowRight' && currentDir.x !== -1) {
        nextDirectionRef.current = { x: 1, y: 0 };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  useEffect(() => {
    if (isGameOver || isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        directionRef.current = nextDirectionRef.current;
        const dir = directionRef.current;
        const head = prevState.snake[0];
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        // Wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setIsGameOver(true);
          return prevState;
        }

        // Self collision
        if (prevState.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          return prevState;
        }

        const newSnake = [newHead, ...prevState.snake];
        let newScore = prevState.score;
        let newFood = prevState.food;

        // Food collision
        if (newHead.x === prevState.food.x && newHead.y === prevState.food.y) {
          newScore += 100;
          newFood = generateFood(newSnake);
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return {
          snake: newSnake,
          food: newFood,
          score: newScore
        };
      });
    }, BASE_SPEED - Math.min(gameState.score / 10, 100)); // Speed up slightly based on score

    return () => clearInterval(gameLoop);
  }, [isGameOver, isPaused, generateFood, gameState.score]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative">
      <div className="absolute top-4 right-8 z-20">
        <div className="font-mono text-right">
          <div className="text-[10px] uppercase tracking-[2px] text-neon-blue">Score</div>
          <div className="text-[48px] font-bold">{gameState.score.toString()}</div>
        </div>
      </div>
      
      <div 
        className="border-[4px] border-neon-green shadow-[0_0_30px_rgba(57,255,20,0.2)] relative w-full max-w-[440px] aspect-square grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_19px,rgba(57,255,20,0.05)_20px),repeating-linear-gradient(90deg,transparent_0,transparent_19px,rgba(57,255,20,0.05)_20px)]"
      >
        {!hasStarted && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <button 
              onClick={startGame}
              className="bg-transparent border border-neon-green text-neon-green px-5 py-2.5 rounded-full text-xs uppercase font-semibold cursor-pointer hover:bg-white/10"
            >
              INITIALIZE_SEQ
            </button>
          </div>
        )}
        
        {isGameOver && hasStarted && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 p-4 text-center">
            <div className="text-neon-pink font-bold text-xl mb-8 uppercase tracking-widest drop-shadow-[0_0_10px_var(--color-neon-pink)]">
              FATAL_ERROR
            </div>
            <button 
              onClick={startGame}
              className="bg-transparent border border-neon-pink text-neon-pink px-5 py-2.5 rounded-full text-xs uppercase font-semibold cursor-pointer hover:bg-white/10"
            >
              REBOOT_SYSTEM
            </button>
          </div>
        )}

        {isPaused && !isGameOver && hasStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="text-neon-blue font-bold text-lg tracking-widest">
              [ SUSPENDED ]
            </div>
          </div>
        )}

        {/* Render grid entities */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          
          const isFood = gameState.food.x === x && gameState.food.y === y;
          const isSnakeHead = gameState.snake[0].x === x && gameState.snake[0].y === y;
          const isSnakeBody = gameState.snake.some((segment, idx) => idx !== 0 && segment.x === x && segment.y === y);

          return (
            <div 
              key={i} 
              className={`relative w-full h-full ${
                isFood ? 'bg-neon-pink rounded-full shadow-[0_0_15px_var(--color-neon-pink)] m-[2px]' : 
                isSnakeHead ? 'bg-white shadow-[0_0_15px_var(--color-neon-green)] rounded-[3px] m-[1px] z-10' :
                isSnakeBody ? 'bg-neon-green shadow-[0_0_10px_var(--color-neon-green)] rounded-[2px] m-[1px]' : 
                ''
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
