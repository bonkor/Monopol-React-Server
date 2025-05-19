import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { useBox, usePlane } from '@react-three/cannon';

import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';


// Импорты текстур
import face1 from '../assets/diceTexture/1.jpg';
import face2 from '../assets/diceTexture/2.jpg';
import face3 from '../assets/diceTexture/3.jpg';
import face4 from '../assets/diceTexture/4.jpg';
import face5 from '../assets/diceTexture/5.jpg';
import face6 from '../assets/diceTexture/6.jpg';

export function Dice3D() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const loader = new THREE.TextureLoader();

  const materials = useMemo(() => {
    return [face1, face6, face2, face5, face3, face4].map((src) => {
      const texture = loader.load(src);
      texture.anisotropy = 16;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return new THREE.MeshStandardMaterial({ map: texture });
    });
  }, []);

  const geometry = useMemo(() => {
    return new RoundedBoxGeometry(1, 1, 1, 4, 0.15);
  }, []);

  // Физическое тело кубика
  const [cubeRef] = useBox(() => ({
    mass: 1,
    position: [0, 5, 0],
    args: [1, 1, 1],
  }));

  // Объединённый ref
  const combinedRef = useCallback((el: THREE.Mesh | null) => {
    if (!el) return;
    meshRef.current = el;
    cubeRef.current = el;
  }, [cubeRef]);

  return (
    <mesh ref={combinedRef} geometry={geometry} material={materials} castShadow />
  );
}

function Floor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="lightgray" />
    </mesh>
  );
}

function Wall({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const [ref] = usePlane(() => ({ position, rotation }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
}

export function Scene() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} castShadow intensity={0.8} />
      <Physics>
        <Floor />
        {/* Стены */}
        <Wall position={[0, 5, -10]} rotation={[0, 0, 0]} />         {/* задняя */}
        <Wall position={[0, 5, 10]} rotation={[0, Math.PI, 0]} />   {/* передняя */}
        <Wall position={[-10, 5, 0]} rotation={[0, Math.PI / 2, 0]} /> {/* левая */}
        <Wall position={[10, 5, 0]} rotation={[0, -Math.PI / 2, 0]} /> {/* правая */}
        <Dice3D />
      </Physics>
      <OrbitControls />
    </Canvas>
  );
}
