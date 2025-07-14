import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { ModalColorPicker } from './ModalColorPicker';
import { Laptop, User, Star, Hourglass } from 'lucide-react';

type ColorPickerState = {
  playerId: string;
} | null;

export function JoinGame() {
  const [name, setName] = useState('');
  const [colorPicker, setColorPicker] = useState<ColorPickerState>(null);

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

  const handleBotToggle = (playerId: string) => {
    sendMessage({ type: 'change-bot', playerId });
  };

  const openColorPicker = (playerId: string) => {
    setColorPicker({ playerId });
  };

  const canStart = players.find((p) => localPlayerIds.includes(p.id) && !p.bot);
  //const canStart = true;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white">
      <div className="bg-gray-100 p-8 rounded-lg shadow-lg flex flex-col gap-4 min-w-[300px]">
        <h2 className="text-xl font-bold text-center">Присоединиться к игре</h2>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
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
          <div className="text-red-600 text-sm font-medium">{errorMessage}</div>
        )}

        <ul className="text-sm text-gray-800 max-h-40 overflow-auto flex flex-col gap-1">
          {players.map((player) => {
            const isLocal = localPlayerIds.includes(player.id);
            return (
              <li
                key={player.id}
                className="flex items-center justify-between py-1 px-2 bg-white rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-400 cursor-pointer shrink-0"
                    style={{ backgroundColor: player.color }}
                    title={isLocal ? 'Изменить цвет' : ''}
                    onClick={() => isLocal && openColorPicker(player.id)}
                  />
                  {isLocal && <Star className="w-4 h-4 text-yellow-500" />}
                  <span className="truncate">{player.name}</span>
                </div>

                <button
                  onClick={() => isLocal && handleBotToggle(player.id)}
                  className={`text-gray-500 hover:text-gray-700 transition ${
                    isLocal ? '' : 'opacity-40 cursor-default'
                  }`}
                  title={player.bot ? 'Бот' : 'Человек'}
                >
                  {player.bot ? <Laptop size={16} /> : <User size={16} />}
                </button>
              </li>
            );
          })}

          {pendingNames.map((pendingName) => (
            <li
              key={`pending-${pendingName}`}
              className="py-1 text-gray-400 italic px-2"
            >
              <Hourglass className="w-4 h-4 inline-block text-gray-400 mr-1" />
              {pendingName}
            </li>
          ))}
        </ul>

        {canStart && (
          <button
            onClick={startGame}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 self-center"
          >
            Начать игру
          </button>
        )}
      </div>

      {colorPicker && (
        <ModalColorPicker
          key={colorPicker.playerId}
          playerId={colorPicker.playerId}
          takenColors={players.map((p) => p.color)}
          onClose={() => setColorPicker(null)}
          onConfirm={(color) => {
            sendMessage({
              type: 'change-color',
              playerId: colorPicker.playerId,
              color,
            });
            setColorPicker(null);
          }}
        />
      )}

      <div className="absolute bottom-2 right-2 text-2x1 text-gray-600 leading-tight text-left">
        <div>F1 — помощь</div>
        <div>F2 — меню</div>
      </div>
    </div>
  );
}
