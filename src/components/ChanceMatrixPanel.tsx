import React, { useEffect, useRef, useState } from 'react';

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

      // Границы по X
      newX = Math.max(0, Math.min(newX, parentRect.width - panelRect.width));
      // Границы по Y
      newY = Math.max(0, Math.min(newY, parentRect.height - panelRect.height));

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

  return (
    <div
      ref={panelRef}
      className="absolute z-60 rounded bg-white shadow-lg p-4 select-none cursor-move border"
      style={{
        width: 360,
        height: 360,
        transform: `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`,
      }}
      onMouseDown={onMouseDown}
    >
      {/* Сетка шанса */}
      <div className="grid grid-cols-7 grid-rows-7 gap-1 w-full h-full">
        {[...Array(7 * 7)].map((_, idx) => {
          const row = Math.floor(idx / 7);
          const col = idx % 7;

          // Заголовки строк и колонок
          if (row === 0 && col === 0) return <div key={idx} />;
          if (row === 0) return <div key={idx} className="text-center font-bold">{col}</div>;
          if (col === 0) return <div key={idx} className="text-center font-bold">{row}</div>;

          const isRowHighlighted = resultRow === row;
          const isColHighlighted = resultCol === col;
          const isIntersection = resultRow === row && resultCol === col;

          let bg = 'bg-white';
          if (isIntersection) bg = 'bg-green-400';
          else if (isRowHighlighted || isColHighlighted) bg = 'bg-gray-300';

          return (
            <div
              key={idx}
              className={`w-full h-full flex items-center justify-center border text-sm ${bg}`}
            >
              🎲
            </div>
          );
        })}
      </div>
    </div>
  );
};
