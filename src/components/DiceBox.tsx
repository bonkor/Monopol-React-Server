import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';

export function DiceBox() {
  const diceResult = useGameStore((state) => state.diceResult);
  const currentPlayerId = useGameStore((state) => state.currentPlayerId);
  const allowDice = useGameStore((state) => state.allowDice);
  const setAllowDice = useGameStore((state) => state.setAllowDice);

  const handleRollDice = () => {
    setAllowDice(false);
    sendMessage({ type: 'roll-dice', playerId: currentPlayerId });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full border border-gray-400 bg-white">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        onClick={handleRollDice}
        disabled={!allowDice}
      >
        Бросить
      </button>

      {diceResult !== null && (
        <div className="mt-4 text-lg font-bold">Результат: {diceResult}</div>
      )}
    </div>
  );
}
