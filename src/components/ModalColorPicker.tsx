import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

type Props = {
  playerId: string;
  takenColors: string[];
  onClose: () => void;
  onConfirm: (color: string) => void;
};

function hexToRgb(hex: string): [number, number, number] {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function colorDistance(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function hslToHex(hsl: string): string {
  const hslMatch = hsl.replace(/\s+/g, '').match(/^hsl\((\d+),(\d+)%?,(\d+)%?\)$/i);
  if (!hslMatch) return '#000000';
  const h = parseInt(hslMatch[1], 10) / 360;
  const s = parseInt(hslMatch[2], 10) / 100;
  const l = parseInt(hslMatch[3], 10) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ModalColorPicker({
  playerId,
  takenColors,
  onClose,
  onConfirm,
}: Props) {
  const player = useGameStore((s) => s.players.find((p) => p.id === playerId));
  const initialColor = player?.color || '#000000';

  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    const hex = initialColor.startsWith('#') ? initialColor : hslToHex(initialColor);
    setSelectedColor(hex);
    console.log('Initialized color for player', playerId, hex);
  }, [initialColor, playerId]);

  const isColorTooSimilar = takenColors
    .filter((c) => c.toLowerCase() !== (player?.color || '').toLowerCase())
    .some((c) => colorDistance(c, selectedColor) < 50);

  return (
    <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-xl shadow-2xl w-[280px] animate-fade-in flex flex-col items-center gap-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          title="Закрыть"
        >
          <X size={18} />
        </button>

        <HexColorPicker color={selectedColor} onChange={setSelectedColor} />

        <div className="flex flex-wrap justify-center gap-1 mt-1">
          {takenColors.map((c, i) => {
            const tooClose = colorDistance(c, selectedColor) < 50;
            return (
              <div
                key={i}
                title={tooClose ? 'Слишком близко к выбранному цвету' : 'Занятый цвет'}
                className={`w-4 h-4 rounded-full border border-gray-300 ${
                  tooClose ? 'ring-2 ring-red-400' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            );
          })}
        </div>

        <div className="relative w-full">
          <button
            onClick={() => onConfirm(selectedColor)}
            disabled={isColorTooSimilar}
            className={`mt-2 w-full px-4 py-2 text-sm rounded transition ${
              isColorTooSimilar
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Применить
          </button>

          {isColorTooSimilar && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded shadow">
              Цвет слишком похож на занятый
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
