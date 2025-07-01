import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { X } from 'lucide-react';

interface MenuModalProps {
  onClose: () => void;
}

export function MenuModal({ onClose }: MenuModalProps) {
  const players = useGameStore((s) => s.players);
  const localIds = useGameStore((s) => s.localPlayerIds);
  const isAdmin = useGameStore((s) => s.isAdmin);

  const focusTrapRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // при маунте окна
    focusTrapRef.current?.focus();
  }, []);

  const [buffer, setBuffer] = useState('');
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setBuffer((prev) => {
        const next = (prev + e.key).slice(-20); // ограничим длину буфера
        if (next.endsWith('admin')) {
          const password = next.slice(0, -'admin'.length);
          sendMessage({ type: 'admin_auth', password: password });
          return ''; // сброс после отправки
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const canRestart = players.every((p) => {
    const isLocal = localIds.includes(p.id);
    const isAlive = !p.isBankrupt && !p.isOffline && !p.bot;
    return !isAlive || isLocal || isAdmin;
  });
  const handleRestart = () => {
    sendMessage({ type: 'restart' });
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-xl shadow-2xl w-[280px] animate-fade-in flex flex-col gap-4 items-stretch">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          title="Закрыть"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-center flex justify-center items-center gap-2">
          Меню
          {isAdmin && (
            <span className="text-sm font-normal text-gray-500">
              (админский режим)
            </span>
          )}
        </h2>

        <button
          onClick={handleRestart}
          disabled={!canRestart}
          className={`w-full px-4 py-2 text-sm rounded transition ${
            canRestart
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Начать заново
        </button>

        {!canRestart && (
          <p className="text-xs text-center text-gray-500">
            Кнопка доступна, только если все оставшиеся живые игроки — локальные
          </p>
        )}

        {isAdmin && (
          <button
            onClick={() => {
              sendMessage({ type: 'list_ips' });
            }}
            className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Список IP
          </button>
        )}
      </div>
      <input
        ref={focusTrapRef}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
