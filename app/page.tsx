'use client';

import React, { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import Game from '@/components/Game';

export default function Home() {
  const { isConnected } = useAppKitAccount();
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  return (
    <main className="min-h-screen min-w-[890px] bg-gradient-to-b from-indigo-80 via-purple-80 to-pink-80 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {isConnected ? (
          gameStarted ? (
            <Game />
          ) : (
            <div className="text-center mb-8">
              <button
                onClick={handleStartGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Start Game
              </button>
            </div>
          )
        ) : (
          <div className="text-center mb-8">
            <p className="text-xl text-black">Connect your wallet to start playing!</p>
          </div>
        )}
      </div>
    </main>
  );
}
