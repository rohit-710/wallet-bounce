'use client';

import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, Connection } from '@solana/web3.js';

interface LeaderboardEntry {
  address: string;
  highScore: number;
  hasClaimedReward?: boolean;
}

const REWARD_AMOUNT = 0.01; // SOL amount to reward

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(Matter.Engine.create());
  const runnerRef = useRef(Matter.Runner.create());
  const racketRef = useRef<Matter.Body | null>(null);
  const ballRef = useRef<Matter.Body | null>(null);
  const currentScoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [lastTransactionSignature, setLastTransactionSignature] = useState<string | null>(null);
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('solana');
  const { connection } = useAppKitConnection();

  // Load leaderboard from localStorage on component mount
  useEffect(() => {
    const savedLeaderboard = localStorage.getItem('breakwalletLeaderboard');
    if (savedLeaderboard) {
      try {
        const parsedLeaderboard = JSON.parse(savedLeaderboard);
        setLeaderboard(parsedLeaderboard);
      } catch (error) {
        console.error('Error parsing leaderboard:', error);
        setLeaderboard([]);
      }
    }
  }, []);

  // Save leaderboard to localStorage whenever it changes
  useEffect(() => {
    if (leaderboard.length > 0) {
      localStorage.setItem('breakwalletLeaderboard', JSON.stringify(leaderboard));
    }
  }, [leaderboard]);

  const updateLeaderboard = (newScore: number) => {
    if (!address) return;

    setLeaderboard(prevLeaderboard => {
      // Remove any duplicate entries for the current address
      const filteredLeaderboard = prevLeaderboard.filter(entry => entry.address !== address);
      
      // Find the highest score for the current address
      const existingEntries = prevLeaderboard.filter(entry => entry.address === address);
      const highestScore = Math.max(newScore, ...existingEntries.map(entry => entry.highScore));
      
      // Reset hasClaimedReward if the new score is higher than any previous score
      const hasClaimedReward = newScore > Math.max(...existingEntries.map(entry => entry.highScore)) ? false : existingEntries.some(entry => entry.hasClaimedReward);
      
      // Add the current address with the highest score
      return [...filteredLeaderboard, { 
        address, 
        highScore: highestScore, 
        hasClaimedReward
      }];
    });
  };

  const handleClaimReward = async () => {
    if (!walletProvider || !address || !connection) {
      console.error('Wallet not connected');
      return;
    }

    setIsClaiming(true);
    setClaimError(null);

    try {
      const response = await fetch('/api/claim-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerAddress: address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsClaiming(false);
        setLastTransactionSignature(data.signature);

        // Update leaderboard to mark reward as claimed
        setLeaderboard(prevLeaderboard =>
          prevLeaderboard.map(entry =>
            entry.address === address
              ? { ...entry, hasClaimedReward: true }
              : entry
          )
        );
      } else {
        console.error('Error claiming reward:', data.error || 'Failed to claim reward');
        setClaimError('Failed to claim reward. Please try again later.');
        setIsClaiming(false);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setClaimError('Failed to claim reward. Please try again later.');
      setIsClaiming(false);
    }
  };

  const canClaimReward = (entry: LeaderboardEntry) => {
    return entry.address === address && 
           entry.highScore > 0 && 
           !entry.hasClaimedReward;
  };

  const startGame = () => {
    if (!ballRef.current) return;
    
    // Reset ball position and velocity
    Matter.Body.setPosition(ballRef.current, { x: 400, y: 300 });
    Matter.Body.setVelocity(ballRef.current, { x: 0, y: -10 }); // Increased initial speed
    
    // Reset game state
    setScore(0);
    currentScoreRef.current = 0;
    setIsGameOver(false);
  };

  // Reset game state when wallet changes
  useEffect(() => {
    setScore(0);
    currentScoreRef.current = 0;
    setIsGameOver(false);
  }, [address]);

  // Update ref when score changes
  useEffect(() => {
    currentScoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = engineRef.current;
    const runner = runnerRef.current;
    const render = Matter.Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#111',
      },
    });

    // Create walls
    const walls = [
      Matter.Bodies.rectangle(400, 0, 800, 20, { isStatic: true }), // Top
      Matter.Bodies.rectangle(400, 600, 800, 20, { isStatic: true }), // Bottom
      Matter.Bodies.rectangle(0, 300, 20, 600, { isStatic: true }), // Left
      Matter.Bodies.rectangle(800, 300, 20, 600, { isStatic: true }), // Right
    ];

    // Create racket
    const racket = Matter.Bodies.rectangle(400, 550, 80, 10, {
      isStatic: true,
      friction: 0,
      frictionAir: 0,
      restitution: 1,
      chamfer: { radius: 5 },
      render: { fillStyle: '#4CAF50' }
    });
    racketRef.current = racket;

    // Create ball
    const ball = Matter.Bodies.circle(400, 300, 12, {
      restitution: 1,
      friction: 0,
      frictionAir: 0.005, // Add slight air resistance
      render: { fillStyle: '#FF5722' },
      label: 'ball'
    });
    ballRef.current = ball;

    // Add all bodies to the world
    Matter.World.add(engine.world, [...walls, racket, ball]);

    // Start the engine and renderer
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Handle racket movement
    const handleMouseMove = (event: MouseEvent) => {
      if (isGameOver) return; // Don't move racket if game is over
      
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      // Constrain racket movement within canvas bounds
      const constrainedX = Math.max(50, Math.min(750, x));
      Matter.Body.setPosition(racket, { x: constrainedX, y: racket.position.y });
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Handle collisions
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Handle ball-racket collisions
        if (bodyA.label === 'ball' && bodyB === racket || bodyB.label === 'ball' && bodyA === racket) {
          const ball = bodyA.label === 'ball' ? bodyA : bodyB;
          const racketBody = bodyA === racket ? bodyA : bodyB;
          
          // Calculate where the ball hit the racket (0 = left edge, 1 = right edge)
          const hitPosition = (ball.position.x - racketBody.position.x + 40) / 80; // Adjusted for new racket size
          
          // Calculate the angle based on hit position
          // -45 degrees for left edge, 45 degrees for right edge
          const angle = -45 + (hitPosition * 90);
          
          // Convert angle to radians
          const radians = (angle * Math.PI) / 180;
          
          // Set new velocity with constant speed
          const speed = 15; // Increased ball speed
          Matter.Body.setVelocity(ball, {
            x: Math.sin(radians) * speed,
            y: -Math.cos(radians) * speed
          });

          // Increment score
          setScore(prev => prev + 1);
        }

        // Handle ball-ground collisions (game over)
        if (bodyA.label === 'ball' && bodyB === walls[1] || bodyB.label === 'ball' && bodyA === walls[1]) {
          // Stop the ball
          Matter.Body.setVelocity(ball, { x: 0, y: 0 });
          // Set game over state and final score
          setIsGameOver(true);
          setFinalScore(currentScoreRef.current);
          updateLeaderboard(currentScoreRef.current);
        }
      });
    });

    // Cleanup function
    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      canvas.removeEventListener('mousemove', handleMouseMove);
      Matter.World.clear(engine.world, false);
    };
  }, []); // Empty dependency array to ensure the effect runs only once

  return (
    <div className="min-h-screen min-w-[890px] bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2 animate-pulse">
          Wallet Bounce
        </h1>
        <p className="text-gray-600 text-lg">Bounce your way to SOL rewards!</p>
      </div>

      <div className="max-w-[800px] mx-auto">
        <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-lg backdrop-blur-sm border border-gray-200 shadow-lg">
            <div className="text-gray-800 text-xl font-bold flex items-center space-x-2">
              <span>Score:</span>
              <span className="text-indigo-600 font-mono">{score}</span>
            </div>
          </div>
          <canvas ref={canvasRef} className="w-full rounded-xl" />
          
          {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm rounded-xl">
              <div className="text-center w-full px-4">
                <div className="text-gray-800 text-6xl font-bold mb-4 animate-bounce bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Game Over!
                </div>
                <div className="text-gray-800 text-3xl mb-8 flex items-center justify-center space-x-2">
                  <span>Final Score:</span>
                  <span className="text-indigo-600 font-mono">{finalScore}</span>
                </div>
                
                {/* Leaderboard */}
                <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-xl mb-8 w-full max-w-md mx-auto border border-gray-200">
                  <h3 className="text-gray-800 text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Leaderboard
                  </h3>
                  <div className="space-y-3">
                    {leaderboard
                      .filter(entry => entry.highScore > 0)
                      .sort((a, b) => b.highScore - a.highScore)
                      .slice(0, 5)
                      .map((entry, index) => (
                        <div 
                          key={`${entry.address}-${index}`} 
                          className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
                            entry.address === address 
                              ? 'bg-indigo-50 border border-indigo-200 shadow-lg shadow-indigo-100' 
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm font-mono ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-500' :
                              index === 2 ? 'text-amber-500' :
                              'text-gray-400'
                            }`}>
                              {index + 1}.
                            </span>
                            <span className="text-gray-700 font-medium">
                              {entry.address === address ? 'You' : `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                            </span>
                            {canClaimReward(entry) && (
                              <div className="flex items-center space-x-2">
                                {isClaiming ? (
                                  <span className="text-indigo-500 text-sm animate-pulse flex items-center space-x-2">
                                    <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                                    <span>Claiming rewards...</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={handleClaimReward}
                                    disabled={isClaiming}
                                    className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm rounded-full hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all duration-200 flex items-center space-x-1 shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
                                  >
                                    <span>Claim</span>
                                    <span className="font-mono">{REWARD_AMOUNT} SOL</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-xl font-bold text-indigo-600 font-mono">{entry.highScore}</span>
                        </div>
                      ))}
                  </div>
                  {claimError && (
                    <div className="text-red-500 text-sm mt-4 text-center bg-red-50 p-2 rounded border border-red-200">
                      {claimError}
                    </div>
                  )}
                  {lastTransactionSignature && (
                    <div className="text-green-500 text-sm mt-4 text-center bg-green-50 p-2 rounded border border-green-200">
                      <span>Reward claimed successfully! </span>
                      <a 
                        href={`https://explorer.solana.com/tx/${lastTransactionSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-green-600 transition-colors duration-200"
                      >
                        View transaction
                      </a>
                    </div>
                  )}
                </div>

                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold text-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game; 