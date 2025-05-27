import { useEffect, useState } from 'react';

export function useCellScreenPosition(
  cellIndex: number | null,
  refMap: React.MutableRefObject<Record<number, HTMLDivElement | null>>
) {
  const [position, setPosition] = useState<{ x: number; y: number; w: number; h: number; } | null>(null);

  const updatePosition = () => {
    if (cellIndex == null) {
      setPosition(null);
      return;
    }

    const el = refMap.current[cellIndex];
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
      });
    }
  };

  useEffect(() => {
    updatePosition(); // initial

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // true: capture phase, useful for nested scroll

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [cellIndex]);

  useEffect(() => {
    updatePosition(); // update if refMap or cellIndex changes
  }, [cellIndex, refMap]);

  return position;
}
