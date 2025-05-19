import { useRef } from 'react';
import * as THREE from 'three';
import { usePlane } from '@react-three/cannon';
import { Dice3D } from './Dice3D';

import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { OrbitControls } from '@react-three/drei';


function Floor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[6, 6]} />
      <meshStandardMaterial color="lightgray" />
    </mesh>
  );
}

function Wall({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const [ref] = usePlane(() => ({ position, rotation }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[6, 6]} />
      <meshStandardMaterial color="gray" transparent="true" opacity="0.2" />
    </mesh>
  );
}

export function Scene() {
  const diceRef = useRef<Dice3DHandle>(null);

  const handleThrow = () => {
    const face = Math.floor(Math.random() * 6) + 1; // случайное число от 1 до 6
    console.log('handleThrow', diceRef);
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

      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} castShadow intensity={0.8} />
      <Physics
        gravity={[0, -9.81, 0]}
        defaultContactMaterial={{
          restitution: .3,     // Упругость
          friction: 0.3,        // Трение
        }}
      >
        <Floor />
        {/* Стены */}
        <Wall position={[0, 3, -3]} rotation={[0, 0, 0]} />         {/* задняя */}
        <Wall position={[0, 3, 3]} rotation={[0, Math.PI, 0]} />   {/* передняя */}
        <Wall position={[-3, 3, 0]} rotation={[0, Math.PI / 2, 0]} /> {/* левая */}
        <Wall position={[3, 3, 0]} rotation={[0, -Math.PI / 2, 0]} /> {/* правая */}
        <Dice3D ref={diceRef} />
      </Physics>
      <OrbitControls />
    </Canvas>
  );
}
