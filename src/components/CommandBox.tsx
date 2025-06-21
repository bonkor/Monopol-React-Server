import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { useConfirmation } from '../context/ConfirmationContext';
import { usePropertyPanel } from '../context/PropertyPanelContext';
import { type Player, getPlayerById } from '@shared/types';
import { FieldType, type FieldDefinition, getFieldByIndex, getFieldStateByIndex } from '@shared/fields';

export function CommandBox() {
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const allowEndTurn = useGameStore((s) => s.allowEndTurn);
  const animatingPlayers = useGameStore((s) => s.animatingPlayers);
  const setAllowEndTurn = useGameStore((s) => s.setAllowEndTurn);
  const { setSacrificeMode, players, fieldStates } = useGameStore.getState();
  const { openPropertyPanel } = usePropertyPanel();

  const { current, clear } = useConfirmation();

  const renderText = (text: string) => {
    const parts: (JSX.Element | string)[] = [];

    const regex = /\{([pF]):(.*?):?([а-я]*)\}/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text))) {
      const [whole, type, value, caseCode] = match;
      const index = match.index;

      // Добавляем текст до совпадения
      if (index > lastIndex) {
        parts.push(text.slice(lastIndex, index));
      }

      if (type === 'p') {
        const player: Player | undefined = getPlayerById(players, value);
        if (player) {
          const name =
            player.cases?.find(c => c.case === caseCode)?.value || player.name;
          const color = player.color;
          parts.push(
            <span key={index} style={{ color, fontWeight: 'bold' }}>
              {name}
            </span>
          );
        } else {
          parts.push('{неизвестный игрок}');
        }
      } else if (type === 'F') {
        const fieldIndex = parseInt(value);
        const field: FieldDefinition | undefined = getFieldByIndex(fieldIndex);
        if (field) {
          const name =
            field.cases?.find(c => c.case === caseCode)?.value || field.name || `Поле ${fieldIndex}`;
          if (field.type === FieldType.Firm) {
            const ownerId = getFieldStateByIndex(fieldStates, fieldIndex).ownerId;
            const owner = getPlayerById(players, ownerId);
            const color = owner ? owner.color : '#484848';
            parts.push(
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  openPropertyPanel(fieldIndex!);
                }}
                className="cursor-pointer"
                style={{ color, fontWeight: 'bold' }}
              >
                {name}
              </span>
            );
          } else {
            parts.push(<span key={index}>{name}</span>);
          }
        } else {
          parts.push('{неизвестное поле}');
        }
      }

      lastIndex = regex.lastIndex;
    }

    // Добавляем остаток текста
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  if (current) {
    return (
      <div className="flex flex-col items-center justify-center h-full border border-gray-400 bg-white p-4">
        {current.content ?? (
          <p className="text-center text-lg font-semibold mb-4">{renderText(current.message)}</p>
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
      {allowEndTurn && (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={handleEndOfTurn}
          disabled={!allowEndTurn && animatingPlayers.size > 0}
        >
          Конец хода
        </button>
      )}
    </div>
  );
}
