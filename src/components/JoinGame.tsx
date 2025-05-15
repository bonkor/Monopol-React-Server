import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';

export function JoinGame() {
  const [name, setName] = useState('');
  const players = useGameStore((s) => s.players);
  const localPlayerIds = useGameStore((s) => s.localPlayerIds);
  const pendingNames = useGameStore((s) => s.pendingNames);
  const addLocalPlayer = useGameStore((s) => s.addLocalPlayer);
  const startGame = useGameStore((s) => s.startGame);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const setError = useGameStore((s) => s.setError);

  const handleAdd = () => {
    if (name.trim()) {
      addLocalPlayer(name.trim());
      setName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white">
      <div className="bg-gray-100 p-8 rounded-lg shadow-lg flex flex-col gap-4 min-w-[300px]">
        <h2 className="text-xl font-bold text-center">Присоединиться к игре</h2>

        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null); // очищаем ошибку при изменении текста
         }}
          onKeyDown={handleKeyDown}
          placeholder="Имя игрока"
          className="p-2 border border-gray-300 rounded"
        />

        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Добавить
        </button>

        {errorMessage && (
          <div className="text-red-600 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <ul className="text-sm text-gray-800 max-h-40 overflow-auto">
          {players.map((player) => {
            const isLocal = localPlayerIds.includes(player.id);
            return (
              <li
                key={player.id}
                className={`py-1 ${
                  isLocal ? 'font-semibold text-green-700' : ''
                }`}
              >
                {isLocal ? '🌟 ' : ''}
                {player.name}
              </li>
            );
          })}

          {pendingNames.map((pendingName) => (
            <li key={`pending-${pendingName}`} className="py-1 text-gray-400 italic">
              ⏳ {pendingName}
            </li>
          ))}
        </ul>
        {localPlayerIds.length > 0 && (
          <button
            onClick={startGame}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 self-center"
          >
            Начать игру
          </button>
        )}
      </div>
    </div>
  );
}
