import { useEffect, useRef, useState } from 'react';
import type { FieldDefinition } from '@shared/fields';

export function PropertyInfoPanel({
  field,
  x,
  y,
  onClose,
}: {
  field: FieldDefinition;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ top: y + 10, left: x + 10 });

  useEffect(() => {
    // Ждём рендера и проверяем размеры окна
    const panel = panelRef.current;
    if (panel) {
      const { innerWidth, innerHeight } = window;
      const rect = panel.getBoundingClientRect();

      const newLeft = (x + rect.width + 20 > innerWidth) ? x - rect.width - 10 : x + 10;
      const newTop = (y + rect.height + 20 > innerHeight) ? y - rect.height - 10 : y + 10;

      setAdjustedPosition({ left: newLeft, top: newTop });
    }
  }, [x, y, field]);

  return (
    <div
      ref={panelRef}
      className="absolute bg-white border shadow-lg p-3 z-50 w-64"
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
      }}
      onClick={(e) => e.stopPropagation()} // Чтобы не закрывалось само
    >
      <div className="font-bold">{field.name}</div>
      <div>Стоимость: {field.cost}</div>
      <div>Доход: {field.baseIncome}</div>
      {/* Можно добавить кнопки действий */}
    </div>
  );
}
