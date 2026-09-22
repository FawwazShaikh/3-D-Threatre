import { useRef, useCallback, useEffect } from 'react';
import useReducedMotion from './useReducedMotion';

const N = 37, R = 891, STEP = 360 / N, CULL = 42, SPEED = 1.9;
const DEG = Math.PI / 180;

/**
 * 3D carousel ring — rAF loop, all transforms via direct DOM writes (no state).
 * @param {React.RefObject[]} cardRefs - array of 37 refs to card DOM nodes
 */
export default function useCarouselRing(cardRefs) {
  const phaseRef = useRef(-2);
  const lastRef = useRef(null);
  const rafRef = useRef(null);
  const reduced = useReducedMotion();

  const placeCards = useCallback(() => {
    const phase = phaseRef.current;
    for (let i = 0; i < N; i++) {
      const el = cardRefs.current?.[i];
      if (!el) continue;
      // Normalise angle to [-180, 180]
      let a = ((i * STEP + phase) % 360 + 540) % 360 - 180;
      if (Math.abs(a) > CULL) {
        el.style.visibility = 'hidden';
        continue;
      }
      el.style.visibility = 'visible';
      const r = a * DEG;
      const c = Math.cos(r);
      const tx = R * Math.sin(r);
      const tz = R * (1 - c);
      el.style.transform = `translate3d(${tx}px,0,${tz}px) rotateY(${-a}deg)`;
      el.style.filter = `brightness(${0.84 + 0.5 * (1 / c - 1)})`;
    }
  }, [cardRefs]);

  useEffect(() => {
    const tick = (t) => {
      if (lastRef.current !== null && !reduced) {
        const dt = Math.min((t - lastRef.current) / 1000, 0.1);
        phaseRef.current -= SPEED * dt;
      }
      lastRef.current = t;
      placeCards();
      rafRef.current = requestAnimationFrame(tick);
    };

    const onVisChange = () => { lastRef.current = null; };
    document.addEventListener('visibilitychange', onVisChange);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [placeCards, reduced]);

  return placeCards;
}

export { N, R, STEP };
