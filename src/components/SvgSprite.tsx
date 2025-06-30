// src/components/SvgSprite.tsx
//import spriteContent from '../../public/sprite.svg?raw';
import spriteContent from '../assets/sprite.svg?raw';

export const SvgSprite = () => (
  <div
    aria-hidden
    style={{ display: 'none' }}
    dangerouslySetInnerHTML={{ __html: spriteContent }}
  />
);
