import { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { useChatStore } from './store/useChatStore';
import { GameBoard } from './components/GameBoard';
import { PropertyPanelProvider } from './context/PropertyPanelContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { JoinGame } from './components/JoinGame';
import { SplashScreen } from './components/SplashScreen';
import { connectSocket } from './services/socket';
import { setupSocketMessageHandler } from './services/socketMessageHandler';

export default function App() {
  const gameStarted = useGameStore((s) => s.gameStarted);
  const stopConnecting = useGameStore((s) => s.stopConnecting);
  const [connected, setConnected] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const [reconnectInterval, setReconnectInterval] = useState<NodeJS.Timeout | null>(null);

  const connecting = !connected && !stopConnecting;

  useEffect(() => {
    const handleOpen = () => {
      setConnected(true);
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        setReconnectInterval(null);
      }
    };

    const handleClose = () => {
      setConnected(false);

      // 💥 ВАЖНО: не сбрасывай, если это добровольный stopConnecting
      if (!useGameStore.getState().stopConnecting) {
        useGameStore.getState().reset();
        useChatStore.getState().reset();

        if (!reconnectInterval) {
          const interval = setInterval(() => {
            connectSocket({ onOpen: handleOpen, onClose: handleClose });
          }, 3000);
          setReconnectInterval(interval);
        }
      }
    };

    connectSocket({ onOpen: handleOpen, onClose: handleClose });
    setupSocketMessageHandler();
  }, []);

  useEffect(() => {
    setFadeClass('opacity-0');
    const timeout = setTimeout(() => {
      setShowGame(gameStarted);
      setFadeClass('opacity-100');
    }, 300);

    return () => clearTimeout(timeout);
  }, [gameStarted]);

  return (
    <ConfirmationProvider>
      {!connected ? (
        <SplashScreen connecting={connecting} />
      ) : (
        <div className={`transition-opacity duration-300 ease-in-out ${fadeClass}`}>
          {showGame ? (
            <PropertyPanelProvider>
              <GameBoard />
            </PropertyPanelProvider>
          ) : (
            <JoinGame />
          )}
        </div>
      )}
    </ConfirmationProvider>
  );
}
