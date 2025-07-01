// src/utils/hooks/useHelpModal.ts
import { useState, useEffect } from 'react';

export function useHelpModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F1') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.code === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen: open,
    openHelp: () => setOpen(true),
    closeHelp: () => setOpen(false),
  };
}
