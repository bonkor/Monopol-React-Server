import React, { useState, useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { Scene } from './Dice3D';
import { CommandBox } from './CommandBox';
import { useGameStore } from '../store/useGameStore';
import { GameCell } from './GameCell';
import { PropertyInfoPanel } from './PropertyInfoPanel';
import { FieldType, fieldDefinitions } from '@shared/fields';

export function GameBoard() {
  const [selectedProperty, setSelectedProperty] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

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
        <Scene />
      </div>


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
