import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';

export function CommandBox() {
  const currentPlayerId = useGameStore((state) => state.currentPlayerId);
  const allowEndTurn = useGameStore((state) => state.allowEndTurn);
  const setAllowEndTurn = useGameStore((state) => state.setAllowEndTurn);

  const handleEndOfTurn = () => {
    setAllowEndTurn(false);
    sendMessage({ type: 'end-of-turn', playerId: currentPlayerId });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full border border-gray-400 bg-white">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        onClick={handleEndOfTurn}
        disabled={!allowEndTurn}
      >
        Конец хода
      </button>
    </div>
  );
}
