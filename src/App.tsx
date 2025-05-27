import { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { GameBoard } from './components/GameBoard';
import { PropertyPanelProvider } from './context/PropertyPanelContext';
import { JoinGame } from './components/JoinGame';

export default function App() {
  const gameStarted = useGameStore((s) => s.gameStarted);
  const [showGame, setShowGame] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  // Плавный переход при изменении gameStarted
  useEffect(() => {
    setFadeClass('opacity-0'); // Сначала выцветаем
    const timeout = setTimeout(() => {
      setShowGame(gameStarted);
      setFadeClass('opacity-100'); // Затем проявляем
    }, 300); // Время анимации должно совпадать с Tailwind transition

    return () => clearTimeout(timeout);
  }, [gameStarted]);

  return (
    <div className={`transition-opacity duration-300 ease-in-out ${fadeClass}`}>
      {showGame ? <PropertyPanelProvider><GameBoard /></PropertyPanelProvider> : <JoinGame />}
    </div>
  );
}
