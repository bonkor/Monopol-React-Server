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
  1: [0, 0, -Math.PI / 2],
  2: [0, 0, 0],
  3: [Math.PI / 2, 0, 0],
  4: [-Math.PI / 2, 0, 0],
  5: [Math.PI, 0, 0],
  6: [0, 0, Math.PI / 2],
};
{/*const faceRotations: Record<number, [number, number, number]> = {
  1: [0, Math.PI / 2, 0],         // +X → вверх
  2: [0, 0, -Math.PI / 2],        // -Z → вверх
  3: [Math.PI, 0, 0],             // -Y → вверх
  4: [0, 0, 0],                   // +Y → вверх
  5: [-Math.PI / 2, 0, 0],        // +Z → вверх
  6: [0, -Math.PI / 2, 0],        // -X → вверх
};*/}

export type Dice3DHandle = {
  throwDice: (targetFace: number) => void;
};

export const Dice3D = forwardRef<Dice3DHandle>((_, ref) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const loader = new THREE.TextureLoader();

  const [targetFace, setTargetFace] = useState<number | null>(null); // от 1 до 6
  const [targetQuat, setTargetQuat] = useState<THREE.Quaternion | null>(null);
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

const setTargetFaceWithQuat = (faceNumber: number) => {
  const faceNormals: Record<number, THREE.Vector3> = {
    1: new THREE.Vector3(1, 0, 0),
    2: new THREE.Vector3(0, 1, 0),
    3: new THREE.Vector3(0, 0, 1),
    4: new THREE.Vector3(0, 0, -1),
    5: new THREE.Vector3(0, -1, 0),
    6: new THREE.Vector3(-1, 0, 0),
  };

  const from = faceNormals[faceNumber].clone();
  const to = new THREE.Vector3(0, 1, 0); // вверх

  const rotationQuat = new THREE.Quaternion().setFromUnitVectors(from, to);

  const baseQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  ));

  const finalQuat = rotationQuat.clone().premultiply(baseQuat);

  setTargetFace(faceNumber);
  setTargetQuat(finalQuat);
  //setIsSettling(true);
console.log('🎯 setTargetFaceWithQuat called for face:', faceNumber);
console.log('🔄 Final targetQuat:', finalQuat.toArray());
};

  // === ⚙️ Экспортируем метод броска наружу ===
  useImperativeHandle(ref, () => ({
    throwDice: (targetFace: number) => {
targetFace = 1;
      console.log('Throwing dice with target face:', targetFace);



setTargetFaceWithQuat(targetFace);
//setTargetFace(targetFace);

      const randX = (Math.random() - 0.5) * 20;
      const randZ = (Math.random() - 0.5) * 20;

      // Сброс позиции и вращения перед броском
      api.position.set(0, 5, 0);
      api.rotation.set(0, 0, 0);
      api.velocity.set(randX, 6 + Math.random() * 2, randZ);
      api.angularVelocity.set(
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10
      );

      // Через 3 секунды начинаем доворот к нужной грани
      setTimeout(() => {
        // Отключаем физику (масса = 0), чтобы не мешала довороту
        api.mass.set(0);

        //setTargetRotation(faceRotations[targetFace]);
        setIsSettling(true);
      }, 3000);
    }
  }));

  useFrame(() => {
    if (  !meshRef.current ) return;

// -----------------------------------------------
  const faceNormals = [
    new THREE.Vector3(1, 0, 0),   // Грань 1
    new THREE.Vector3(0, 1, 0),  // Грань 2
    new THREE.Vector3(0, 0, 1),  // Грань 3
    new THREE.Vector3(0, 0, -1),   // Грань 4
    new THREE.Vector3(0, -1, 0),   // Грань 5
    new THREE.Vector3(-1, 0, 0),  // Грань 6
  ];

  meshRef.current.updateMatrixWorld(true); // Без этого работает неправильно

  const up = new THREE.Vector3(0, 1, 0);
  let bestFace = 0;
  let maxDot = -Infinity;

  faceNormals.forEach((normal, index) => {
    const worldNormal = normal.clone().applyMatrix4(meshRef.current.matrixWorld).normalize();
    const dot = worldNormal.dot(up);
    if (dot > maxDot) {
      maxDot = dot;
      bestFace = index + 1;
    }
  });

  // Лог текущей ориентации
  if (isSettling) {
    console.log('🌀 Settling...');
    console.log('🎯 Target face:', targetFace);
    console.log('👁️ Best face up now:', bestFace);
    console.log('🧭 Quaternion now:', meshRef.current.quaternion.toArray());
    if (targetQuat) {
      console.log('🎯 TargetQuat:', targetQuat.toArray());
      const angleDiff = meshRef.current.quaternion.angleTo(targetQuat);
      console.log('📐 Angle to targetQuat:', angleDiff.toFixed(4));
    }
  }

  if (!isSettling && bestFace !== 0) {
    console.log(`🎲 Итог: сверху оказалась грань ${bestFace}`);
  }
// -----------------------------------------------

if (isSettling && targetFace && targetQuat) {
  meshRef.current.quaternion.slerp(targetQuat, 0.2);

  api.velocity.set(0, 0, 0);
  api.angularVelocity.set(0, 0, 0);

  const angleDiff = meshRef.current.quaternion.angleTo(targetQuat);
  if (angleDiff < 0.01) {
    meshRef.current.quaternion.copy(targetQuat);

    api.mass.set(1);
    setIsSettling(false);
    setTargetFace(null);
    setTargetQuat(null);
    
    console.log('✅ Доворот завершён. Кубик выставлен точно.');
  }
}

  });

  return (
    <mesh ref={combinedRef} geometry={geometry} material={materials} castShadow>
      <axesHelper args={[1.5]} />
    </mesh>
  );
});
