import React, { useState, useEffect, useRef } from 'react';
import { ChatWindow } from './ChatWindow';
import { DiceScene } from './DiceScene';
import { CommandBox } from './CommandBox';
import { PlayerList } from './PlayerList';
import { useGameStore } from '../store/useGameStore';
import { GameCell } from './GameCell';
import { PropertyInfoPanel } from './PropertyInfoPanel';
import { ChanceMatrixPanel } from './ChanceMatrixPanel';
import { registerOpenPropertyPanel, registerClosePropertyPanel } from '../controllers/PropertyPanelController';
import { usePropertyPanel } from '../context/PropertyPanelContext';
import { DirectionSelector } from './DirectionSelector';
import { MoveDecisionPopup } from './MoveDecisionPopup';
import { MonopolyListPanel } from './MonopolyListPanel';
import { FieldType, fieldDefinitions } from '@shared/fields';
import { sendMessage } from '../services/socket';
import { Direction } from '@shared/types';
import { useCellScreenPosition } from '../utils/hooks/useCellScreenPosition';

export function GameBoard() {
  const { selectedIndex, openPropertyPanel, closePanel } = usePropertyPanel();
  const cellRefMap = useRef<Record<number, HTMLDivElement | null>>({});
  const player = useGameStore.getState().getCurrentPlayer();
  const playerCellIndex = player?.position ?? null;
  const cellEl = playerCellIndex !== null ? cellRefMap.current[playerCellIndex] : null;

  const propertyPanelPosition = useCellScreenPosition(selectedIndex, cellRefMap);

  const goStayDir = useGameStore((state) => state.goStayDir);
  const showMonopolyList = useGameStore((state) => state.showMonopolyList);
  const setShowMonopolyList = useGameStore((state) => state.setShowMonopolyList);

  useEffect(() => {
    registerOpenPropertyPanel(openPropertyPanel);
    registerClosePropertyPanel(closePanel); // используем context-метод
  }, [openPropertyPanel, closePanel]);

  useEffect(() => {
    const handleClick = () => closePanel();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [closePanel]);

const showChanceMatrixPanel = true;
  return (
    <div className="relative grid grid-cols-11 grid-rows-11 w-full h-full h-screen overflow-hidden">
      {Array.from({ length: 121 }, (_, index) => {
        const row = Math.floor(index / 11);
        const col = index % 11;

        const isPerimeter = row === 0 || row === 10 || col === 0 || col === 10;
        const isCross = (row === 5 || col === 5) && !isPerimeter;

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
                    e.stopPropagation();
                    openPropertyPanel(cellIndex!);
                  }
                : undefined
            }
          />
        ) : (
          <div key={index} className="relative flex" />
        );
      })}

      {/* Окно команд и шанса */}
      <div
        className="absolute z-10 w-full h-full"
        style={{ gridColumn: '2 / span 4', gridRow: '2 / span 4' }}
      >
        <CommandBox />
      </div>

      {/* Список игроков */}
      <div
        className="absolute z-10 w-full h-full"
        style={{ gridColumn: '7 / span 4', gridRow: '2 / span 4' }}
      >
        <PlayerList />
      </div>

      {/* Окно чата */}
      <div
        className="absolute z-10 w-full h-full"
        style={{ gridColumn: '2 / span 4', gridRow: '7 / span 4' }}
      >
        <ChatWindow />
      </div>

      {/* Зона кубика */}
      <div
        className="absolute z-10 w-full h-full"
        style={{ gridColumn: '7 / span 4', gridRow: '7 / span 4' }}
      >
        <DiceScene />
      </div>

      {useGameStore((state) => state.allowCenterBut) && (
        <DirectionSelector
          onSelect={(dir) => {
            sendMessage({ type: 'dir-choose', playerId: useGameStore.getState().currentPlayerId, dir });
            useGameStore.getState().setAllowCenterBut(false);
          }}
        />
      )}

      {useGameStore((state) => state.allowGoStayBut) && cellEl && (
        <MoveDecisionPopup
          targetRef={cellEl}
          direction={goStayDir}
          onMove={() => {
            sendMessage({ type: 'go-stay-choose', playerId: useGameStore.getState().currentPlayerId, dec: Direction.Move });
            useGameStore.getState().setAllowGoStayBut(false);
          }}
          onStay={() => {
            sendMessage({ type: 'go-stay-choose', playerId: useGameStore.getState().currentPlayerId, dec: Direction.Stay });
            useGameStore.getState().setAllowGoStayBut(false);
          }}
        />
      )}

      {/* Панель свойств */}
      {selectedIndex !== null && propertyPanelPosition && (
        <PropertyInfoPanel
          field={fieldDefinitions.find(f => f.index === selectedIndex)!}
          x={propertyPanelPosition.x + propertyPanelPosition.w / 2}
          y={propertyPanelPosition.y + propertyPanelPosition.h / 2}
          onRequestClose={() => closePanel()}
        />
      )}
    {showMonopolyList && (
      <MonopolyListPanel
        onClose={() => {setShowMonopolyList(false)}}
        handleFirmClick={(cellIndex) => {
          setShowMonopolyList(false);
          openPropertyPanel(cellIndex!);
        }}
        handleMonopolyClick={(arr) => {
          setShowMonopolyList(false);
          useGameStore.getState().setHighlightedCompanies(arr);
          // Удалить подсветку через 1.5 секунды
          setTimeout(() => {
            useGameStore.getState().clearHighlightedCompanies();
          }, 1500);
        }}
      />
    )}
    {showChanceMatrixPanel && (
      <ChanceMatrixPanel
        resultRow={3}
        resultCol={5}
        onClose={() => {
          console.log('Закрыто');
        }}
      />
    )}
    </div>
  );
}
