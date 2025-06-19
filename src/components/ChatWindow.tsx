import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { usePropertyPanel } from '../context/PropertyPanelContext';
import { type Player, getPlayerById, getPlayerByName } from '@shared/types';
import { FieldType, type FieldDefinition, getFieldByIndex, getFieldStateByIndex } from '@shared/fields';

export function ChatWindow() {
  const { messages } = useChatStore();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { openPropertyPanel } = usePropertyPanel();

  const lastLocalPlayerId = useGameStore((state) => state.lastLocalPlayerId);
  const players = useGameStore((state) => state.players);
  const fieldStates = useGameStore((state) => state.fieldStates);

  // Автоскролл
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    sendMessage({ type: 'chat', playerId: lastLocalPlayerId, text: trimmed });
    setText('');
  };

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

  return (
    <div className="p-2 text-xs flex flex-col bg-white border border-gray-400 shadow-md w-full h-full">
      <div className="flex-1 overflow-y-auto pr-1" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.from && (
              <span
                className="font-bold mr-1"
                style={{ color: getPlayerByName(players, msg.from)?.color ?? 'black' }}
              >
                {msg.from}:
              </span>
            )}
            <span>{renderText(msg.text)}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex mt-1">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение..."
        />
        <button
          type="submit"
          className="ml-1 bg-blue-500 text-white px-2 py-0.5 rounded text-xs"
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
