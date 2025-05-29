import { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { GameBoard } from './components/GameBoard';
import { PropertyPanelProvider } from './context/PropertyPanelContext';
import { ConfirmationProvider } from './context/ConfirmationContext'; // <- импорт нового провайдера
import { JoinGame } from './components/JoinGame';

export default function App() {
  const gameStarted = useGameStore((s) => s.gameStarted);
  const [showGame, setShowGame] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  useEffect(() => {
    setFadeClass('opacity-0');
    const timeout = setTimeout(() => {
      setShowGame(gameStarted);
      setFadeClass('opacity-100');
    }, 300);

    return () => clearTimeout(timeout);
  }, [gameStarted]);

  return (
    <div className={`transition-opacity duration-300 ease-in-out ${fadeClass}`}>
      {showGame ? (
        <ConfirmationProvider> {/* внешний провайдер */}
          <PropertyPanelProvider> {/* вложенный провайдер */}
            <GameBoard />
          </PropertyPanelProvider>
        </ConfirmationProvider>
      ) : (
        <JoinGame />
      )}
    </div>
  );
}
