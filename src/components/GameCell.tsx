import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { FieldType, fieldDefinitions } from '@shared/fields';

interface GameCellProps {
  index: number;
  cellIndex: number | null;
  onClickFirm?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
}

export function GameCell({ index, cellIndex, onClickFirm }: GameCellProps) {
  const field = fieldDefinitions.find((f) => f.index === cellIndex) ?? null;
  const players = useGameStore((state) => state.players);
  const playersHere = cellIndex !== null
    ? players.filter((p) => p.position === cellIndex)
    : [];

  if (!field) {
    return <div className="bg-transparent" />;
  }

  const isFirm = field.type === FieldType.Firm;

  return (
    <div
      className={`relative w-full h-full border border-gray-300 ${
        isFirm ? 'bg-green-300 hover:bg-green-400 cursor-pointer' : 'bg-green-200'
      }`}
      onClick={field?.type === FieldType.Firm ? onClickFirm : undefined}
    >
      <div className="flex items-center justify-center text-[10px] text-center p-[2px] w-full h-full font-mono">
        {
          {
            [FieldType.Firm]: field.name,
            [FieldType.Ques3]: '???',
            [FieldType.Ques]: '?',
            [FieldType.Pip]: 'Pip',
            [FieldType.Start]: 'START +25',
            [FieldType.Taxi]: 'TAXI',
            [FieldType.Jail]: 'Тюрьма',
            [FieldType.Birga]: 'Биржа -10',
          }[field.type]
        }
      </div>

      {/* Фишки игроков */}
      <div className="absolute bottom-1 left-1 right-1 flex gap-[2px] flex-wrap justify-center items-center">
        {playersHere.map((player) => (
          <div
            key={player.id}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stringToColor(player.name) }}
            title={player.name}
          />
        ))}
      </div>
    </div>
  );
}
