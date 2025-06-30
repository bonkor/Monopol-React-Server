// src/hooks/useMenuModal.ts
import { useState, useEffect } from 'react';

export function useMenuModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F2') {
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
    openMenu: () => setOpen(true),
    closeMenu: () => setOpen(false),
  };
}
