import { useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { usePlane } from '@react-three/cannon';
import { Dice3D, type Dice3DHandle } from './Dice3D';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';

export type DiceSceneHandle = {
  throwDice: (targetFace: number) => void;
  onDiceSettled: (callback: (face: number) => void) => void;
};

type SceneContentProps = {
  diceRef: React.RefObject<Dice3DHandle>;
  onSettled?: (face: number) => void;
};

function SceneContent({ diceRef, onSettled }: SceneContentProps) {
  const { size, camera } = useThree();
  const aspect = size.width / size.height;

  const viewHeight = 5;
  const wallHeight = 6;
  const viewWidth = viewHeight * aspect;

  useEffect(() => {
    if ('left' in camera) {
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.near = -10;
      camera.far = 20;
      camera.position.set(0, 10, 0);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    }
  }, [camera, viewWidth, viewHeight]);

  // Для стабильного key
  const sizeKey = useMemo(() => `${viewWidth},${viewHeight}`, [viewWidth, viewHeight]);

  return (
    <Physics
      gravity={[0, -9.81, 0]}
      defaultContactMaterial={{
        restitution: 0.3,
        friction: 0.3,
      }}
    >
      <Floor key={`floor-${sizeKey}`} pos={[0, 0, 0]} rot={[-Math.PI / 2, 0, 0]} size={[viewWidth, viewHeight]} />
      <Wall key={`wall-back-${sizeKey}`} pos={[0, wallHeight / 2, -viewHeight / 2]} rot={[0, 0, 0]} size={[viewWidth, wallHeight]} />
      <Wall key={`wall-front-${sizeKey}`} pos={[0, wallHeight / 2, viewHeight / 2]} rot={[0, Math.PI, 0]} size={[viewWidth, wallHeight]} />
      <Wall key={`wall-left-${sizeKey}`} pos={[-viewWidth / 2, wallHeight / 2, 0]} rot={[0, Math.PI / 2, 0]} size={[viewHeight, wallHeight]} />
      <Wall key={`wall-right-${sizeKey}`} pos={[viewWidth / 2, wallHeight / 2, 0]} rot={[0, -Math.PI / 2, 0]} size={[viewHeight, wallHeight]} />
      <Dice3D ref={diceRef} onSettled={onSettled} />
    </Physics>
  );
}

function Floor({ pos, rot, size }: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number] }) {
  const [ref] = usePlane(() => ({ rotation: rot, position: pos }));
  return (
    <mesh key={size.join(',')} ref={ref} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function Wall({ pos, rot, size }: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number] }) {
  const [ref] = usePlane(() => ({
    rotation: rot,
    position: pos,
    args: size,
    type: 'Static',
  }));

  return (
    <mesh key={size.join(',')} ref={ref} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="gray" transparent opacity={0.2} />
    </mesh>
  );
}

export function DiceIcon({ className = "w-6 h-6 text-green-500" }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
    </svg>
  );
}

function ClearBackground() {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor(0x000000, 0); // Чёрный, но полностью прозрачный фон
  }, [gl]);
  return null;
}

export const DiceScene = forwardRef<DiceSceneHandle>((_, ref) => {
  const diceRef = useRef<Dice3DHandle>(null);
  const settledCallbackRef = useRef<(face: number) => void>();
  const diceEnabled = useGameStore((s) => s.allowDice);
  const myTurn = useGameStore((s) => s.myTurn);

  useImperativeHandle(ref, () => ({
    throwDice: (face: number) => {
      diceRef.current?.throwDice(face);
    },
    onDiceSettled: (cb: (face: number) => void) => {
      settledCallbackRef.current = cb;
    }
  }));

  const handleCanvasClick = () => {
    if (!diceEnabled) return;
    const { setSacrificeMode } = useGameStore.getState();
    setSacrificeMode(null);
    sendMessage({ type: 'roll-dice', playerId: useGameStore.getState().currentPlayerId });
    diceRef.current?.throwDice(useGameStore.getState().diceResult);
    useGameStore.getState().setAllowDice(false);
  };

  return (
    <div className={`relative w-full h-full ${myTurn && diceEnabled ? 'outline outline-4 outline-green-500 animate-pulse rounded-md' : ''}`}>
      <Canvas
        onClick={myTurn && diceEnabled ? handleCanvasClick : undefined}
        shadows
        orthographic
        gl={{ alpha: true }}
        camera={{
          position: [0, 10, 0],
          top: 15,
          bottom: -15,
          left: -30,
          right: 30,
          zoom: 5,
        }}
        className={myTurn && diceEnabled ? 'outline outline-4 outline-green-500 rounded-md' : ''}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} castShadow intensity={0.6} />
        <SceneContent
          diceRef={diceRef}
          onSettled={(face) => {
            settledCallbackRef.current?.(face);
            useGameStore.getState().setAllowDice(false);
            sendMessage({ type: 'roll-dice-end', playerId: useGameStore.getState().currentPlayerId });
          }}
        />
      </Canvas>

      {!myTurn && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="text-white text-xl font-semibold drop-shadow">
            ⏳ Ожидание хода...
          </div>
        </div>
      )}

      {myTurn && diceEnabled && (
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
            <DiceIcon className="w-6 h-6 text-green-500" />
        </div>
      )}

    </div>

  );
});
