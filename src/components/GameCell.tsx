import React, { forwardRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { stringToColor } from '../utils/stringToColor';
import { FieldType, fieldDefinitions, InvestmentType } from '@shared/fields';
import { isFieldInCompetedMonopoly } from '@shared/monopolies';
import './GameCell.css';
import clsx from 'clsx';

export const countryFlagIndexMap: Record<string, number> = {
  USSR: 0,
  USA_Ind: 1,
  USA_Int: 2,
  England: 3,
  Japan: 4,
  Balkan: 5,
  France: 6,
  BRD: 7,
  DDR: 8,
  Hungary: 9,
  Italy: 10,
  Holland: 11,
  Switzerland: 12,
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
  return `-54px -${79 + index * 19}px`; //
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

export const GameCell = forwardRef<HTMLDivElement, GameCellProps>(
  function GameCell({ index, cellIndex, onClickFirm }, ref) {
    const field = fieldDefinitions.find((f) => f.index === cellIndex) ?? null;
    const players = useGameStore((state) => state.players);
    const fieldStates = useGameStore((state) => state.fieldStates);
    const fieldState = fieldStates.find(f => f.index === cellIndex);

    const ownerId = fieldState?.ownerId;
    const owner = players.find(p => p.id === ownerId);
    const ownerColor = owner ? stringToColor(owner.name) : 'transparent';

    const playersHere = cellIndex !== null
      ? players.filter((p) => p.position === cellIndex)
      : [];

    if (!field) return <div className="bg-transparent" />;

    const highlightedCompanies = useGameStore((s) => s.highlightedCompanies);
    const isHighlighted = highlightedCompanies.includes(field.index);

    const isFirm = field.type === FieldType.Firm;

    const { lastLocalPlayerId } = useGameStore();
    const sacrificeMode = useGameStore((s) => s.sacrificeMode);
    const isTarget = sacrificeMode?.targetFieldIndex === field.index;
    const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldStates});
    const isCandidate =
      sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeCompany &&
      fieldState.ownerId === lastLocalPlayerId &&
      field.index !== sacrificeMode.targetFieldIndex ||
      sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeMonopoly &&
      fieldInCompetedMonopoly.ownerId === lastLocalPlayerId && fieldInCompetedMonopoly.monopolies.length > 0 &&
      field.index !== sacrificeMode.targetFieldIndex;

    return (
      <div
        ref={ref}
        className={`relative w-full h-full border border-gray-300 transition-colors duration-500
          ${
            isHighlighted
              ? 'bg-yellow-300'
              : isTarget
              ? 'bg-yellow-400'
              : isCandidate
              ? 'bg-red-500'
              : isFirm
              ? 'bg-[#c0c0c0] hover:bg-green-400 cursor-pointer'
              : 'bg-[#c0c0c0]'
          }
        `}
        onClick={isFirm ? onClickFirm : undefined}
        style={{
          border: isFirm && owner ? `4px solid ${stringToColor(owner.name)}` : undefined,
        }}
      >
        {/* Иконка в центре — если не фирма */}
        {!isFirm && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="icon-wrapper">
              <div className={`sprite sprite-${field.type}`} />
            </div>
          </div>
        )}

        {/* Контент фирмы */}
        {isFirm && (
          <>
            {/* Флаг страны */}
            <div className="absolute top-[5px] left-[5px] w-5 h-5 bg-flag bg-no-repeat bg-contain" style={{
              backgroundPosition: getFlagOffset(field.country)
            }} />

            {/* Иконка типа компании */}
            <div className="absolute top-[2px] right-[2px] w-5 h-5 bg-ind bg-no-repeat bg-contain" style={{
              backgroundPosition: getIndustryOffset(field.industry)
            }} />

            {/* Название */}
            <div className="absolute inset-0 flex items-center justify-center text-[14px] text-center font-mono px-1">
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
