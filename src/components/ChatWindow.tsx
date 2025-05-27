import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';

export function ChatWindow() {
  const { messages } = useChatStore();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastLocalPlayerId = useGameStore((state) => state.lastLocalPlayerId);

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

  return (
    <div className="p-2 text-xs flex flex-col bg-white border border-gray-400 shadow-md w-full h-full">
      <div className="flex-1 overflow-y-auto pr-1" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <span className="font-bold mr-1">{msg.from}:</span>
            <span>{msg.text}</span>
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
