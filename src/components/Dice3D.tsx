import {
  useState,
  useRef,
  useMemo,
  useImperativeHandle,
  useCallback,
  forwardRef,
} from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { useBox } from '@react-three/cannon';

// Импорты текстур
import face1 from '../assets/diceTexture/1.jpg';
import face2 from '../assets/diceTexture/2.jpg';
import face3 from '../assets/diceTexture/3.jpg';
import face4 from '../assets/diceTexture/4.jpg';
import face5 from '../assets/diceTexture/5.jpg';
import face6 from '../assets/diceTexture/6.jpg';

// Варианты ориентации для нужной верхней грани
const faceRotations: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [Math.PI / 2, 0, 0],
  3: [0, 0, -Math.PI / 2],
  4: [0, 0, Math.PI / 2],
  5: [-Math.PI / 2, 0, 0],
  6: [Math.PI, 0, 0],
};

export type Dice3DHandle = {
  throwDice: (targetFace: number) => void;
};

export const Dice3D = forwardRef<Dice3DHandle>((_, ref) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const loader = new THREE.TextureLoader();

  const [targetRotation, setTargetRotation] = useState<[number, number, number] | null>(null);
  const [isSettling, setIsSettling] = useState(false);

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
  const [cubeRef, api] = useBox(() => ({
    mass: 1,
    position: [0, 5, 0],
    args: [1, 1, 1],
    restitution: .6, // Упругость: выше — сильнее отскок
  }));

  // Объединённый ref
  const combinedRef = useCallback((el: THREE.Mesh | null) => {
    if (!el) return;
    meshRef.current = el;
    cubeRef.current = el;
  }, [cubeRef]);

  // === ⚙️ Экспортируем метод броска наружу ===
  useImperativeHandle(ref, () => ({
    throwDice: (targetFace: number) => {
      console.log('useImperativeHandle',  targetFace);
      const randX = (Math.random() - 0.5) * 20;
      const randZ = (Math.random() - 0.5) * 20;

      api.position.set(0, 5, 0);
      api.velocity.set(randX, 0 + Math.random() * 1, randZ);
      api.angularVelocity.set(
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10
      );

      // Через 2 секунды — начинаем тормозить и доворачивать
      setTimeout(() => {
        setTargetRotation(faceRotations[targetFace]);
        setIsSettling(true);
      }, 3000);
    },
  }));

  useFrame(() => {
    if (!isSettling || !meshRef.current) return;

    // Получаем текущее вращение
    const current = meshRef.current.rotation;
    const target = targetRotation!;
    
    // Плавная интерполяция (Lerp)
    current.x += (target[0] - current.x) * 0.1;
    current.y += (target[1] - current.y) * 0.1;
    current.z += (target[2] - current.z) * 0.1;

    // Затормозим полностью
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);

    // Когда близко к цели — останавливаем
    const dx = Math.abs(current.x - target[0]);
    const dy = Math.abs(current.y - target[1]);
    const dz = Math.abs(current.z - target[2]);
    if (dx < 0.01 && dy < 0.01 && dz < 0.01) {
      current.set(...target);
      setIsSettling(false);
      setTargetRotation(null);
    }
  });

  return (
    <mesh ref={combinedRef} geometry={geometry} material={materials} castShadow />
  );
});
