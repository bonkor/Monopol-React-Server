import React from 'react';
import { ChatWindow } from './ChatWindow';
import { useGameStore } from '../store/useGameStore';

export function GameBoard() {
  const players = useGameStore((state) => state.players);

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 50%)`;
  return color;
}

  return (
    <div className="relative grid grid-cols-11 grid-rows-11 w-full h-full h-screen">
      {Array.from({ length: 121 }, (_, index) => {
        const row = Math.floor(index / 11);
        const col = index % 11;

        const isPerimeter = row === 0 || row === 10 || col === 0 || col === 10;
        const isCross = (row === 5 || col === 5) && !isPerimeter;
        const isCenter = row === 5 && col === 5;

        let cellIndex: number | null = null;

        if (isPerimeter) {
          if (row === 0) cellIndex = col;
          else if (col === 10) cellIndex = 10 + row;
          else if (row === 10) cellIndex = 20 + (10 - col);
          else if (col === 0) cellIndex = 30 + (10 - row);
        } else if (isCross) {
          if (row === 5) cellIndex = 40 + (col - 1);
          else if (col === 5) cellIndex = 48 + (row < 5 ? row : row - 1);
        }

        const playersHere = cellIndex !== null
          ? players.filter((p) => p.position === cellIndex)
          : [];


        return (
          <div
            key={index}
            className={`relative flex items-center justify-center text-xs font-mono ${
              isCenter
                ? 'bg-yellow-400 font-bold'
                : cellIndex !== null
                ? 'bg-green-200 border border-gray-300'
                : ''
            }`}
          >
            <span className="opacity-60">
              {isCenter ? 'СТАРТ (44)' : cellIndex !== null ? cellIndex : ''}
            </span>

            {/* Фишки игроков */}
            <div className="flex gap-[2px] flex-wrap justify-center items-center">
              {playersHere.map((player, i) => (
                <div
                  key={player.id}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: stringToColor(player.name),
                  }}
                  title={player.name}
                />
              ))}
            </div>

          </div>
        );
      })}

      {/* Окно чата в col:1–4, row:6–9 */}
      <div
        className="absolute z-10 w-full h-full"
        style={{
          gridColumn: '2 / span 4',
          gridRow: '7 / span 4',
        }}
      >
        <ChatWindow />
      </div>
    </div>
  );
}
