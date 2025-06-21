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
import { playSound, unlockAudio } from '../utils/playSound';

// Импорты текстур
import face1 from '../assets/diceTexture/1.jpg';
import face2 from '../assets/diceTexture/2.jpg';
import face3 from '../assets/diceTexture/3.jpg';
import face4 from '../assets/diceTexture/4.jpg';
import face5 from '../assets/diceTexture/5.jpg';
import face6 from '../assets/diceTexture/6.jpg';

type Dice3DProps = {
  onSettled?: (face: number) => void;
};

export type Dice3DHandle = {
  throwDice: (targetFace: number) => void;
};

export const Dice3D = forwardRef<Dice3DHandle, Dice3DProps>(({ onSettled }, ref) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const loader = new THREE.TextureLoader();

  const [isSettling, setIsSettling] = useState(false);

  const targetFaceRef = useRef<number | null>(null);
  const rotationStartRef = useRef<THREE.Quaternion | null>(null);
  const rotationEndRef = useRef<THREE.Quaternion | null>(null);
  const rotationProgressRef = useRef(0);
  const isSettlingRef = useRef(false);

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
    restitution: 0.6,
    onCollide: (e) => {
      const impact = e.contact.impactVelocity;

      if (impact > 1.5) {
        const volume = Math.min(1, impact / 10);
        playSound('hit', volume);
      }
    },
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
      targetFaceRef.current = targetFace;
      //console.log('🎲 Бросок кубика с целью получить грань:', targetFace);
      unlockAudio();

      const randX = (Math.random() - 0.5) * 20;
      const randZ = (Math.random() - 0.5) * 20;

      // Сброс состояния перед броском
      api.mass.set(1); // Включаем физику обратно (на всякий случай)
      api.position.set(0, 5, 0);
      api.rotation.set(0, 0, 0);
      api.velocity.set(randX, 6 + Math.random() * 2, randZ);
      api.angularVelocity.set(
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10
      );

      // Через 2 секунды начинаем доворот
      setTimeout(() => {
        if (targetFace) {
          const faceNormals = [
            new THREE.Vector3(1, 0, 0),   // Face 1
            new THREE.Vector3(0, 1, 0),   // Face 2
            new THREE.Vector3(0, 0, 1),   // Face 3
            new THREE.Vector3(0, 0, -1),  // Face 4
            new THREE.Vector3(0, -1, 0),  // Face 5
            new THREE.Vector3(-1, 0, 0),  // Face 6
          ];

          const currentQuat = meshRef.current.getWorldQuaternion(new THREE.Quaternion());
          const dir = faceNormals[targetFace - 1].clone().normalize();
          const worldDir = dir.clone().applyQuaternion(currentQuat);
          const worldUp = new THREE.Vector3(0, 1, 0);
          const rotateQuat = new THREE.Quaternion().setFromUnitVectors(worldDir, worldUp);
          const finalWorldQuat = rotateQuat.multiply(currentQuat);

          // === Заморозка физики ===
          api.velocity.set(0, 0, 0);
          api.angularVelocity.set(0, 0, 0);
          // Не отключаем массу — физика остаётся включённой

          rotationStartRef.current = currentQuat;
          rotationEndRef.current = finalWorldQuat;
          rotationProgressRef.current = 0;
          isSettlingRef.current = true;
          setIsSettling(true); // если нужно визуально или логически
        }
      }, 2000);
    }
  }));

  function getCurrentTop(meshRef) {
    // === Вычисление текущей верхней грани ===
    const faceNormals = [
      new THREE.Vector3(1, 0, 0),   // Грань 1
      new THREE.Vector3(0, 1, 0),   // Грань 2
      new THREE.Vector3(0, 0, 1),   // Грань 3
      new THREE.Vector3(0, 0, -1),  // Грань 4
      new THREE.Vector3(0, -1, 0),  // Грань 5
      new THREE.Vector3(-1, 0, 0),  // Грань 6
    ];

    meshRef.current.updateMatrixWorld(true);
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

    if (!isSettling && bestFace !== 0) {
      console.log(`🎲 Итог: сверху оказалась грань ${bestFace}`);
    }
  }

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    //getCurrentTop(meshRef);

    // === Доворот к целевой грани ===
    if (isSettlingRef.current && rotationStartRef.current && rotationEndRef.current) {
      rotationProgressRef.current += delta / 0.5;

      const t = Math.min(rotationProgressRef.current, 1);
      const slerpedQuat = rotationStartRef.current.clone().slerp(rotationEndRef.current, t);

      // Принудительно задаём кватернион
      api.quaternion.set(slerpedQuat.x, slerpedQuat.y, slerpedQuat.z, slerpedQuat.w);

      if (t >= 1) {
        const currentQuat = new THREE.Quaternion();
        meshRef.current.getWorldQuaternion(currentQuat);
        const targetQuat = rotationEndRef.current;
        const dot = currentQuat.dot(targetQuat);
        const angle = 2 * Math.acos(Math.min(Math.abs(dot), 1));
        const degrees = THREE.MathUtils.radToDeg(angle);

        if (degrees > 2) {
          // Повторяем доворот
          rotationStartRef.current = currentQuat.clone();
          rotationProgressRef.current = 0;
        } else {
          // === Завершаем доворот ===
          isSettlingRef.current = false;
          setIsSettling(false);

          rotationStartRef.current = null;
          rotationEndRef.current = null;

          // Можно включить физику снова — просто "разбудить"
          api.wakeUp?.(); // На случай, если ранее была sleep()

          if (onSettled && targetFaceRef.current !== null) {
            onSettled(targetFaceRef.current);
          }
        }
      }
    }
  });

  return (
    <mesh ref={combinedRef} geometry={geometry} material={materials} castShadow>
    </mesh>
  );
});
