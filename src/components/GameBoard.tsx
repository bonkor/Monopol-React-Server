import React, { useState, useEffect, useRef } from 'react';
import { ChatWindow } from './ChatWindow';
import { DiceScene } from './DiceScene';
import { CommandBox } from './CommandBox';
import { useGameStore } from '../store/useGameStore';
import { GameCell } from './GameCell';
import { PropertyInfoPanel } from './PropertyInfoPanel';
import { DirectionSelector } from './DirectionSelector';
import { MoveDecisionPopup } from './MoveDecisionPopup';
import { FieldType, fieldDefinitions } from '@shared/fields';
import { sendMessage } from '../services/socket';
import { Direction } from '@shared/types';
import { useCellScreenPosition } from '../utils/hooks/useCellScreenPosition';

export function GameBoard() {
  const [selectedProperty, setSelectedProperty] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const cellRefMap = useRef<Record<number, HTMLDivElement | null>>({});
  const player = useGameStore.getState().getCurrentPlayer();
  const playerCellIndex = player?.position ?? null;
  const cellEl = playerCellIndex !== null ? cellRefMap.current[playerCellIndex] : null;

  // Закрытие по клику вне окна
  useEffect(() => {
    const handleClick = () => setSelectedProperty(null);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProperty(null);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const goStayDir = useGameStore((state) => state.goStayDir);

  return (
    <div className="relative grid grid-cols-11 grid-rows-11 w-full h-full h-screen overflow-hidden">
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

        const field = fieldDefinitions.find(f => f.index === cellIndex);

        return (isPerimeter || isCross) ? (
          <GameCell
            key={index}
            index={index}
            cellIndex={cellIndex}
            ref={(el) => {
              if (cellIndex != null) {
                cellRefMap.current[cellIndex] = el;
              }
            }}
            onClickFirm={
              field?.type === FieldType.Firm
                ? (e) => {
                    e.stopPropagation(); // чтобы не срабатывал глобальный клик
                    const rect = e.currentTarget.getBoundingClientRect();
                    setSelectedProperty({
                      index: cellIndex!,
                      x: rect.left,
                      y: rect.top,
                    });
                  }
                : undefined
            }
          />
        ) : (
          <div key={index} className="relative flex" />
        );
      })}

      {/* Окно команд */}
      <div
        className="absolute z-10 w-full h-full"
        style={{
          gridColumn: '2 / span 4',
          gridRow: '2 / span 4',
        }}
      >
        <CommandBox />
      </div>

      {/* Окно чата */}
      <div
        className="absolute z-10 w-full h-full"
        style={{
          gridColumn: '2 / span 4',
          gridRow: '7 / span 4',
        }}
      >
        <ChatWindow />
      </div>

      {/* Зона кубика col:6–9, row:6–9 */}
      <div
        className="absolute z-10 w-full h-full"
        style={{
          gridColumn: '7 / span 4',
          gridRow: '7 / span 4',
        }}
      >
        <DiceScene />
      </div>

      {useGameStore((state) => state.allowCenterBut) && (
        <DirectionSelector
          onSelect={(dir) => {
            sendMessage({ type: 'dir-choose', playerId: useGameStore.getState().currentPlayerId, dir: dir });
            useGameStore.getState().setAllowCenterBut(false);
          }}
        />
      )}

      {useGameStore((state) => state.allowGoStayBut) && cellEl && (
        <MoveDecisionPopup
          targetRef={cellEl}
          direction={ goStayDir }
          onMove={() => {
            console.log('Двигаемся вперёд!');
            // Обработка движения
          }}
          onStay={() => {
            console.log('Остаемся на месте');
            // Завершение хода
          }}
        />
      )}

      {selectedProperty && (
        <PropertyInfoPanel
          field={fieldDefinitions.find(f => f.index === selectedProperty.index)!}
          x={selectedProperty.x}
          y={selectedProperty.y}
          onRequestClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
