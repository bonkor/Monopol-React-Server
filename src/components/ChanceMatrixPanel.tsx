import { useEffect, useState, useRef } from 'react';

type ChanceMatrixPanelProps = {
  onClose: () => void;
  resultRow: number;
  resultCol: number;
  delay?: number;
};

export function ChanceMatrixPanel({
  onClose,
  resultRow,
  resultCol,
  delay = 2000,
}: ChanceMatrixPanelProps) {
  const [showRow, setShowRow] = useState(false);
  const [showCol, setShowCol] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setShowRow(true), 300);
    const t2 = setTimeout(() => setShowCol(true), 1000);
    const t3 = setTimeout(() => setShowResult(true), 1500);
    const t4 = setTimeout(onClose, delay + 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    };

    const handleMouseUp = () => setDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    // Корректно считаем смещение от текущей позиции translate
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    setDragging(true);
  };

  const getCellStyle = (r: number, c: number) => {
    const isRow = showRow && r === resultRow - 1;
    const isCol = showCol && c === resultCol - 1;
    const isTarget = showResult && isRow && isCol;

    if (isTarget) return 'bg-yellow-400 animate-pulse';
    if (isRow || isCol) return 'bg-gray-300';
    return 'bg-white';
  };

  return (
    <div
      className="absolute z-20 pointer-events-none w-full h-full flex items-center justify-center"
      style={{ top: 0, left: 0 }}
    >
      <div
        ref={panelRef}
        className="bg-white rounded shadow border pointer-events-auto relative transition-all"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          userSelect: dragging ? 'none' : 'auto',
          minWidth: 'max-content',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={onMouseDown}
      >
        <div className="p-2 grid grid-cols-[30px_repeat(6,40px)] grid-rows-[30px_repeat(6,40px)]">
          <div />
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={`col-title-${n}`} className="flex items-center justify-center text-xs font-bold">
              {n}
            </div>
          ))}

          {Array.from({ length: 6 }, (_, r) => (
            <>
              <div key={`row-title-${r}`} className="flex items-center justify-center text-xs font-bold">
                {r + 1}
              </div>
              {Array.from({ length: 6 }, (_, c) => (
                <div
                  key={`cell-${r}-${c}`}
                  className={`w-10 h-10 border border-gray-300 flex items-center justify-center transition-colors duration-300 ${getCellStyle(r, c)}`}
                >
                  🎲
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
