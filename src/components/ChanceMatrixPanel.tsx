import React, { useEffect, useRef, useState } from 'react';

const handlers: Record<string, () => void> = {
  '1,1': () => { return '+10' },
  '1,2': () => { return '-10' },
  '1,3': () => { return '5 ->' },
  '1,4': () => { return '5 <-' },
  '1,5': () => { return 'пб \?' },
  '1,6': () => { return '\?\?\?' },
  '2,1': () => { return '-15' },
  '2,2': () => { return '+15' },
  '2,3': () => { return 'l' },
  '2,4': () => { return 'cha' },
  '2,5': () => { return '\?' },
  '2,6': () => { return 'o o o' },
  '3,1': () => { return 'buy' },
  '3,2': () => { return '-30' },
  '3,3': () => { return '+30' },
  '3,4': () => { return 'sell' },
  '3,5': () => { return 'V +' },
  '3,6': () => { return 'bir' },
  '4,1': () => { return 'p *' },
  '4,2': () => { return 'r *' },
  '4,3': () => { return '-50' },
  '4,4': () => { return '+50' },
  '4,5': () => { return 'V II' },
  '4,6': () => { return 'jail' },
  '5,1': () => { return '+st' },
  '5,2': () => { return '-st' },
  '5,3': () => { return 's m' },
  '5,4': () => { return 'V-10' },
  '5,5': () => { return 'V+10' },
  '5,6': () => { return 'V l' },
  '6,1': () => { return '↩' },
  '6,2': () => { return 'seq' },
  '6,3': () => { return 'taxi' },
  '6,4': () => { return '.-st' },
  '6,5': () => { return 'V-15' },
  '6,6': () => { return 'V+15' },
};

function getChanceIcon(row: number, col: number): string {
  const handlerKey = `${row},${col}`;
  return handlers[handlerKey]?.();
}

type Props = {
  resultRow?: number; // 1–6
  resultCol?: number; // 1–6
  onClose: () => void;
};

export const ChanceMatrixPanel: React.FC<Props> = ({ resultRow, resultCol, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLElement | null>(null);

  const positionRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const [_, forceUpdate] = useState(0);
  const [dragging, setDragging] = useState(false);

  const OFFSET_X = 200;
  const OFFSET_Y = 100;

  // Определение границ родителя
  useEffect(() => {
    let node = panelRef.current?.parentElement;
    while (node && !node.classList.contains('game-board')) {
      node = node.parentElement;
    }
    parentRef.current = node ?? null;
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    offsetRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
    setDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !panelRef.current || !parentRef.current) return;

      const parentRect = parentRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();

      let newX = e.clientX - offsetRef.current.x;
      let newY = e.clientY - offsetRef.current.y;

      // ограничиваем, учитывая оффсет (в координатах без transform)
      newX = Math.max(-OFFSET_X, Math.min(newX, parentRect.width - panelRect.width - OFFSET_X));
      newY = Math.max(-OFFSET_Y, Math.min(newY, parentRect.height - panelRect.height - OFFSET_Y));

      positionRef.current = { x: newX, y: newY };
      forceUpdate((v) => v + 1);
    };

    const handleMouseUp = () => setDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (resultRow && resultCol) {
      const timeout = setTimeout(() => {
        onClose();
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [resultRow, resultCol]);

  return (
    <div
      ref={panelRef}
      className="absolute z-60 rounded bg-white shadow-lg p-4 select-none cursor-move border"
      style={{
        position: 'absolute',
        left: positionRef.current.x + OFFSET_X,
        top: positionRef.current.y + OFFSET_Y,
        width: 540,
        height: 540,
      }}
      onMouseDown={onMouseDown}
    >
      {/* Сетка шанса */}
      <div
        className="grid gap-1 w-full h-full"
        style={{
          gridTemplateRows: '0.5fr repeat(6, 1fr)',
          gridTemplateColumns: '0.5fr repeat(6, 1fr)',
        }}
      >
        {[...Array(7 * 7)].map((_, idx) => {
          const row = Math.floor(idx / 7);
          const col = idx % 7;

          if (row === 0 && col === 0) return <div key={idx} />;
          if (row === 0) {
            return (
              <div
                key={idx}
                className="text-center font-bold flex items-center justify-center border"
              >
                {col}
              </div>
            );
          }
          if (col === 0) {
            return (
              <div
                key={idx}
                className="text-center font-bold flex items-center justify-center border"
              >
                {row}
              </div>
            );
          }

          const isRowHighlighted = resultRow === row;
          const isColHighlighted = resultCol === col;
          const isIntersection = isRowHighlighted && isColHighlighted;

          const bgClass = isIntersection
            ? 'bg-green-400'
            : isRowHighlighted || isColHighlighted
              ? 'bg-gray-300'
              : 'bg-white';

          return (
            <div
              key={idx}
              className={`w-full h-full flex items-center justify-center border text-sm ${bgClass} transition-colors duration-500`}
            >
              {getChanceIcon(row, col)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
