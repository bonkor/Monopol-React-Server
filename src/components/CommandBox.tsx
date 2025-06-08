import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { useConfirmation } from '../context/ConfirmationContext';

export function CommandBox() {
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const allowEndTurn = useGameStore((s) => s.allowEndTurn);
  const setAllowEndTurn = useGameStore((s) => s.setAllowEndTurn);
  const { setSacrificeMode } = useGameStore.getState();

  const { current, clear } = useConfirmation();

  if (current) {
    return (
      <div className="flex flex-col items-center justify-center h-full border border-gray-400 bg-white p-4">
        {current.content ?? (
          <p className="text-center text-lg font-semibold mb-4">{current.message}</p>
        )}
        <div className="flex gap-4 mt-4">
          {current.buttons.map((btn, idx) => (
            <button
              key={idx}
              className={btn.className ?? "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"}
              onClick={async () => {
                await btn.action();
                clear();
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleEndOfTurn = () => {
    setSacrificeMode(null);
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
