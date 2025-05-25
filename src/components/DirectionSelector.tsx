import { FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Direction } from '@shared/types';

interface DirectionSelectorProps {
  onSelect: (direction: Direction) => void;
}

export function DirectionSelector({ onSelect }: DirectionSelectorProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div className="relative w-40 h-40">
        {/* Up */}
        <button
          className="absolute top-0 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-md p-3 hover:bg-green-100 transition pointer-events-auto"
          onClick={() => onSelect(Direction.Up)}
        >
          <FaArrowUp />
        </button>

        {/* Down */}
        <button
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-md p-3 hover:bg-green-100 transition pointer-events-auto"
          onClick={() => onSelect(Direction.Down)}
        >
          <FaArrowDown />
        </button>

        {/* Left */}
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-3 hover:bg-green-100 transition pointer-events-auto"
          onClick={() => onSelect(Direction.Left)}
        >
          <FaArrowLeft />
        </button>

        {/* Right */}
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-3 hover:bg-green-100 transition pointer-events-auto"
          onClick={() => onSelect(Direction.Right)}
        >
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
}
