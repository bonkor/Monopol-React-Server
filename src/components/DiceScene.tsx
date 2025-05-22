import { useRef } from 'react';
import * as THREE from 'three';
import { usePlane } from '@react-three/cannon';
import { Dice3D, type Dice3DHandle } from './Dice3D';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { OrbitControls } from '@react-three/drei';

type SceneContentProps = {
  diceRef: React.RefObject<Dice3DHandle>;
};

function SceneContent({ diceRef }: SceneContentProps) {
  const { size, camera } = useThree();
  const aspect = size.width / size.height;

  // Видимая высота мира — например 6 единиц
  const viewHeight = 6;
  const wallHeight = 6;

  const viewWidth = viewHeight * aspect;
console.log(viewWidth / 2);
  return (
    <Physics
      gravity={[0, -9.81, 0]}
      defaultContactMaterial={{
        restitution: .3,     // Упругость
        friction: 0.3,        // Трение
      }}
    >
      <Floor pos={[0, 0, 0]} rot={[-Math.PI / 2, 0, 0]} size={[viewWidth, viewHeight]} />
      {/* Стены */}
      <Wall pos={[0, wallHeight / 2, -viewHeight / 2]} rot={[0, 0, 0]} size={[viewWidth, wallHeight]} />         {/* задняя */}
      <Wall pos={[0, wallHeight / 2, viewHeight / 2]} rot={[0, Math.PI, 0]} size={[viewWidth, wallHeight]} />   {/* передняя */}
      <Wall pos={[-viewWidth / 2, wallHeight / 2, 0]} rot={[0, Math.PI / 2, 0]} size={[viewHeight, wallHeight]} /> {/* левая */}
      <Wall pos={[viewWidth / 2, wallHeight / 2, 0]} rot={[0, -Math.PI / 2, 0]} size={[viewHeight, wallHeight]} /> {/* правая */}
      <Dice3D ref={diceRef} />
    </Physics>
  );
}

function Floor({
  pos,
  rot,
  size,
}: {
  pos: [number, number, number];
  rot: [number, number, number];
  size: [number, number];
}) {
  const [ref] = usePlane(() => ({
    rotation: rot,
    position: pos,
  }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function Wall({
  pos,
  rot,
  size,
}: {
  pos: [number, number, number];
  rot: [number, number, number];
  size: [number, number];
}) {
  const [ref] = usePlane(() => ({
    rotation: rot,
    position: pos,
  }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="gray" transparent="true" opacity="0.2" />
    </mesh>
  );
}

export function Scene() {
  const diceRef = useRef<Dice3DHandle>(null);

  const handleThrow = () => {
    const face = Math.floor(Math.random() * 6) + 1; // случайное число от 1 до 6
    diceRef.current?.throwDice(face);
  };

  return (
    <Canvas onClick={handleThrow} shadows orthographic
      camera={{
        position: [0, 10, 0],
        top: 15,
        bottom: -15,
        left: -30,
        right: 30,
        zoom: 5
      }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} castShadow intensity={0.6} />
      <SceneContent diceRef={diceRef} />
      {/*<OrbitControls />*/}
    </Canvas>
  );
}
