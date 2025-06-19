import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { ModalColorPicker } from './ModalColorPicker';
import { X } from 'lucide-react';

type ColorPickerState = {
  playerId: string;
} | null;

export function JoinGame() {
  const [name, setName] = useState('');
  const [colorPicker, setColorPicker] = useState<ColorPickerState>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');

  const players = useGameStore((s) => s.players);
  const localPlayerIds = useGameStore((s) => s.localPlayerIds);
  const pendingNames = useGameStore((s) => s.pendingNames);
  const addLocalPlayer = useGameStore((s) => s.addLocalPlayer);
  const startGame = useGameStore((s) => s.startGame);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const setError = useGameStore((s) => s.setError);

  function hexToRgb(hex: string): [number, number, number] {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }

  function colorDistance(hex1: string, hex2: string): number {
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  }

  const isColorTooSimilar = colorPicker && players.some(
    (p) =>
      p.id !== colorPicker.playerId &&
      colorDistance(p.color, selectedColor) < 25
  );

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

  const handleColorConfirm = () => {
    if (colorPicker) {
      sendMessage({
        type: 'change-color',
        playerId: colorPicker.playerId,
        color: selectedColor,
      });
      setColorPicker(null);
    }
  };

  // Инициализируем selectedColor из player.color
  useEffect(() => {
    if (colorPicker) {
      const player = players.find((p) => p.id === colorPicker.playerId);
      if (player) {
        setSelectedColor(player.color);
      }
    }
  }, [colorPicker, players]);

  const currentPickerPlayer = colorPicker
    ? players.find((p) => p.id === colorPicker.playerId)
    : null;

  const currentColor = currentPickerPlayer?.color || '#000000';

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
                  {isLocal && <span>🌟</span>}
                  <span className="truncate">{player.name}</span>
                </div>

                <label className="flex items-center gap-1 text-gray-600 text-xs">
                  <input
                    type="checkbox"
                    checked={!!player.bot}
                    onChange={() => isLocal && handleBotToggle(player.id)}
                    disabled={!isLocal}
                  />
                  бот
                </label>
              </li>
            );
          })}

          {pendingNames.map((pendingName) => (
            <li
              key={`pending-${pendingName}`}
              className="py-1 text-gray-400 italic px-2"
            >
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

      {colorPicker && (
        <ModalColorPicker
          currentColor={currentColor}
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
    </div>
  );
}
