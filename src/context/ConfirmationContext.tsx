import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { registerConfirmationHandlers } from '../controllers/ConfirmationController';
import { useGameStore } from '../store/useGameStore';

type ConfirmationButton = {
  label: string;
  action: () => void | Promise<void>;
  className?: string;
};

type ConfirmationOptions = {
  message?: string;
  content?: React.ReactNode;
  buttons: ConfirmationButton[];
};

type ConfirmationContextType = {
  current: ConfirmationOptions | null;
  requestConfirmation: (options: ConfirmationOptions) => void;
  confirm: (message: string) => Promise<boolean>; // упрощённый API
  clear: () => void;
};

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export const useConfirmation = () => {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) throw new Error("useConfirmation must be used within ConfirmationProvider");
  return ctx;
};

export const ConfirmationProvider = ({ children }: { children: React.ReactNode }) => {
  const [current, setCurrent] = useState<ConfirmationOptions | null>(null);
  const setConfirmationPending = useGameStore((s) => s.setConfirmationPending);
  const [promiseResolver, setPromiseResolver] = useState<((value: boolean) => void) | null>(null);

  const requestConfirmation = (options: ConfirmationOptions) => {
    setCurrent(options);
    setConfirmationPending(true);
  };

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPromiseResolver(() => resolve);

      setCurrent({
        message,
        buttons: [
          {
            label: 'Отмена',
            className: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
            action: () => resolve(false),
          },
          {
            label: 'Подтвердить',
            className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700',
            action: () => resolve(true),
          },
        ],
      });

      setConfirmationPending(true);
    });
  };

  const clear = () => {
    setCurrent(null);
    setConfirmationPending(false);
    setPromiseResolver(null);
  };

  // 🧩 Регистрируем при монтировании
  useEffect(() => {
    registerConfirmationHandlers(requestConfirmation, confirm, clear);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ current, requestConfirmation, confirm, clear }}>
      {children}
    </ConfirmationContext.Provider>
  );
};
