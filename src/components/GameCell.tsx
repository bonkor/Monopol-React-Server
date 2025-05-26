import React, { forwardRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { FieldType, fieldDefinitions } from '@shared/fields';
import './GameCell.css';

export const countryFlagIndexMap: Record<string, number> = {
  USSR: 0,
  USA: 1,
  England: 2,
  Japan: 3,
  Balkan: 4,
  France: 5,
  Germany: 6,
  Hungary: 7,
  Italy: 8,
  Holland: 9,
  Switzerland: 10,
};

export const industryIconIndexMap: Record<string, number> = {
  Avia: 0,
  Studio: 1,
  Oil: 2,
  Electro: 3,
  Newspaper: 4,
  Automotive: 5,
  Media: 6,
  Food: 7,
  Radio: 8,
  Tourism: 9,
  Healthcare: 10,
  Spy: 11,
  Port: 12,
};

export function getFlagOffset(country: string): string {
  const index = countryFlagIndexMap[country] ?? 0;
  return `-54px -${92 + index * 19}px`; //
}

export function getIndustryOffset(industry: string): string {
  const index = industryIconIndexMap[industry] ?? 0;
  return `-79px -${1 + index * 25}px`; //
}

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

export const GameCell = forwardRef<HTMLDivElement, GameCellProps>(
  function GameCell({ index, cellIndex, onClickFirm }, ref) {
    const field = fieldDefinitions.find((f) => f.index === cellIndex) ?? null;
    const players = useGameStore((state) => state.players);
    //const ownership = useGameStore((state) => state.ownership); // если есть
    //const ownerId = ownership[cellIndex ?? -1];
    const ownerId = 0;
    const owner = players.find(p => p.id === ownerId);
    const ownerColor = owner ? stringToColor(owner.name) : 'transparent';

    const playersHere = cellIndex !== null
      ? players.filter((p) => p.position === cellIndex)
      : [];

    if (!field) return <div className="bg-transparent" />;

    const isFirm = field.type === FieldType.Firm;

    return (
      <div
        ref={ref}
        className={`relative w-full h-full border border-gray-300 bg-[#c0c0c0] ${
          isFirm ? 'hover:bg-green-100 cursor-pointer' : ''
        }`}
        onClick={isFirm ? onClickFirm : undefined}
        style={{
          boxShadow: isFirm && owner ? `inset 0 0 0 4px ${ownerColor}` : undefined,
        }}
      >
        {/* Иконка в центре — если не фирма */}
        {!isFirm && (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`sprite sprite-${field.type} w-6 h-6 bg-no-repeat bg-contain`} />
          </div>
        )}

        {/* Контент фирмы */}
        {isFirm && (
          <>
            {/* Флаг страны */}
            <div className="absolute top-0 left-0 w-4 h-4 bg-flag bg-no-repeat bg-contain" style={{
              backgroundPosition: getFlagOffset(field.country)
            }} />

            {/* Иконка типа компании */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-ind bg-no-repeat bg-contain" style={{
              backgroundPosition: getIndustryOffset(field.industry)
            }} />

            {/* Название */}
            <div className="absolute inset-0 flex items-center justify-center text-[9px] text-center font-mono px-1">
              {field.name}
            </div>
          </>
        )}

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
);
