import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldDefinition } from '@shared/fields';

export function PropertyInfoPanel({
  field,
  x,
  y,
  onRequestClose,
}: {
  field: FieldDefinition;
  x: number;
  y: number;
  onRequestClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ top: y + 10, left: x + 10 });
  const [visible, setVisible] = useState(true); // управляем видимостью

  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      const { innerWidth, innerHeight } = window;
      const rect = panel.getBoundingClientRect();

      const newLeft = (x + rect.width + 20 > innerWidth) ? x - rect.width - 10 : x + 10;
      const newTop = (y + rect.height + 20 > innerHeight) ? y - rect.height - 10 : y + 10;

      setAdjustedPosition({ left: newLeft, top: newTop });
    }
  }, [x, y, field]);

  useEffect(() => {
    const handleClickOutside = () => setVisible(false);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <AnimatePresence
      onExitComplete={onRequestClose} // вызываем onClose после завершения анимации
    >
      {visible && (
        <motion.div
          ref={panelRef}
          className="absolute bg-white border shadow-lg p-3 z-50 w-64"
          style={{
            top: adjustedPosition.top,
            left: adjustedPosition.left,
          }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.8, x: -10, y: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -10, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="font-bold">{field.name}</div>
          <div>Стоимость: {field.cost}</div>
          <div>Доход: {field.baseIncome}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
