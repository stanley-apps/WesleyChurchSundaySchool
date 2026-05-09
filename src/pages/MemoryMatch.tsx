import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Timer as TimerIcon } from 'lucide-react';
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';

const BIBLE_EMOJIS = ['⛪', '📖', '🕊️', '🍎', '🦁', '🚢', '🌈', '🌟', '👑', '🕯️', '🍞', '🍷'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryMatch() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const initializeGame = useCallback(() => {
    const pairCount = 8; // 4x4 grid
    const selectedEmojis = BIBLE_EMOJIS.slice(0, pairCount);
    const gameCards = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(gameCards);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setIsWon(false);
    setTime(0);
    setIsActive(false);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    let interval: any;
    if (isActive && !isWon) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isWon]);

  const handleCardClick = (index: number) => {
    if (!isActive) setIsActive(true);
    if (flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatches((prev) => {
            const newMatches = prev + 1;
            if (newMatches === 8) {
              setIsWon(true);
              confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
              });
            }
            return newMatches;
          });
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/dashboard/games" className="text-blue-600 hover:underline flex items-center gap-1">
              ⬅️ Back to Games
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Memory Match 🃏</h1>
            <button 
              onClick={initializeGame}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={20} className="text-blue-600" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Trophy size={20} /></div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold">Moves</div>
                <div className="text-xl font-bold text-gray-900">{moves}</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg text-green-600"><TimerIcon size={20} /></div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold">Time</div>
                <div className="text-xl font-bold text-gray-900">{formatTime(time)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`aspect-square rounded-2xl text-4xl sm:text-5xl flex items-center justify-center transition-all duration-500 transform preserve-3d ${
                  card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                }`}
              >
                <div className="relative w-full h-full transition-transform duration-500 transform-style-3d">
                  <div className={`absolute inset-0 w-full h-full rounded-2xl bg-blue-600 border-4 border-white shadow-lg flex items-center justify-center backface-hidden ${
                    card.isFlipped || card.isMatched ? 'hidden' : 'block'
                  }`}>
                    <span className="text-white opacity-20 font-black">?</span>
                  </div>
                  <div className={`absolute inset-0 w-full h-full rounded-2xl bg-white border-4 border-blue-200 shadow-lg flex items-center justify-center backface-hidden ${
                    card.isFlipped || card.isMatched ? 'block' : 'hidden'
                  }`}>
                    {card.emoji}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {isWon && (
            <div className="mt-12 text-center animate-bounce">
              <h2 className="text-4xl font-black text-blue-600 mb-2">Well Done! 🎉</h2>
              <p className="text-gray-700 text-lg">You matched all pairs in {moves} moves!</p>
              <button 
                onClick={initializeGame}
                className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-blue-700 transition-all"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  );
}