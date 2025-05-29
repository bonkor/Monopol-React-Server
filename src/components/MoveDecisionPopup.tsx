import {
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaCircle,
} from 'react-icons/fa';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Direction } from '@shared/types';

interface MoveDecisionPopupProps {
  targetRef: HTMLElement | null;
  direction: Direction;
  onStay: () => void;
  onMove: () => void;
}

export function MoveDecisionPopup({
  targetRef,
  direction,
  onStay,
  onMove,
}: MoveDecisionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Вычисление позиции
  const updatePosition = () => {
    if (!targetRef || !popupRef.current) return;

    const rect = targetRef.getBoundingClientRect();
    const popup = popupRef.current;
    const popupRect = popup.getBoundingClientRect();

    const margin = 8;

    let top = rect.top + window.scrollY;
    let left = rect.left + window.scrollX;

    // Направление позиционирования относительно клетки
    switch (direction) {
      case 'up':
//        top -= popupRect.height + margin;
        top -= margin;
        left += rect.width / 2 - popupRect.width / 2;
        break;
      case 'down':
//        top += rect.height + margin;
        top += margin;
        left += rect.width / 2 - popupRect.width / 2;
        break;
      case 'left':
        top += rect.height / 2 - popupRect.height / 2;
//        left -= popupRect.width + margin;
        left -= margin;
        break;
      case 'right':
        top += rect.height / 2 - popupRect.height / 2;
//        left += rect.width + margin;
        left += margin;
        break;
    }

    // Автокоррекция, чтобы не вылезло за край окна
    const maxLeft = window.innerWidth - popupRect.width - margin;
    const maxTop = window.innerHeight - popupRect.height - margin;

    setPosition({
      top: Math.max(margin, Math.min(top, maxTop)),
      left: Math.max(margin, Math.min(left, maxLeft)),
    });
  };

  useLayoutEffect(() => {
    updatePosition();
  }, [targetRef, direction]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, []);

  const isVertical = direction === 'up' || direction === 'down';
  const moveFirst = direction === 'up' || direction === 'left';

  const ArrowIcon = {
    up: <FaArrowUp />,
    down: <FaArrowDown />,
    left: <FaArrowLeft />,
    right: <FaArrowRight />,
  }[direction];

  return (
    <div
      ref={popupRef}
      className="absolute z-30 flex pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div
        className={`flex ${
          isVertical ? 'flex-col' : 'flex-row'
        } items-center justify-center gap-2 pointer-events-auto`}
      >
        {moveFirst ? (
          <>
            <button
              onClick={onMove}
              className="bg-white text-green-600 rounded-full p-3 shadow-md hover:bg-green-100 transition"
            >
              {ArrowIcon}
            </button>
            <button
              onClick={onStay}
              className="bg-white text-gray-600 rounded-full p-3 shadow-md hover:bg-gray-100 transition"
            >
              <FaCircle />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onStay}
              className="bg-white text-gray-600 rounded-full p-3 shadow-md hover:bg-gray-100 transition"
            >
              <FaCircle />
            </button>
            <button
              onClick={onMove}
              className="bg-white text-green-600 rounded-full p-3 shadow-md hover:bg-green-100 transition"
            >
              {ArrowIcon}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
