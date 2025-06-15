import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export function SplashScreen({ connecting }: { connecting: boolean }) {
  const [dots, setDots] = useState(1);
  const errorMessage = useGameStore((state) => state.errorMessage);

  useEffect(() => {
    if (!connecting) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [connecting]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-black relative">
      <h1 className="text-5xl font-bold">МОНОПОЛИЯ</h1>
      <p className="text-sm text-gray-600 mt-2">(c) К.Стройковский</p>
      <p className="absolute bottom-4 left-4 text-gray-800">
        {!connecting && errorMessage ? (
          <span className="text-red-600 font-semibold">{errorMessage}</span>
        ) : (
          <span>Подключаемся к серверу{'.'.repeat(dots)}</span>
        )}
      </p>
    </div>
  );
}
