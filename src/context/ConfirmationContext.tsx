// context/ConfirmationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ConfirmationOptions = {
  message: string;
};

type ConfirmationContextType = {
  requestConfirmation: (options: ConfirmationOptions) => Promise<boolean>;
};

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export const useConfirmation = () => {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) throw new Error("useConfirmation must be used within ConfirmationProvider");
  return ctx;
};

export const ConfirmationProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolver, setResolver] = useState<((result: boolean) => void) | null>(null);

  const requestConfirmation = (opts: ConfirmationOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleResult = (result: boolean) => {
    if (resolver) {
      resolver(result);
      setResolver(null);
    }
    setOptions(null);
  };

  return (
    <ConfirmationContext.Provider value={{ requestConfirmation }}>
      {children}
      {options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center">
            <p className="text-lg font-semibold mb-4">{options.message}</p>
            <div className="flex justify-center space-x-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                onClick={() => handleResult(false)} // ✅ используем handleResult
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                onClick={() => handleResult(true)} // ✅ используем handleResult
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};
