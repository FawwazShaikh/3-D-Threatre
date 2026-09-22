import { useRef, useCallback } from 'react';
import Card from './Card';
import useCarouselRing, { N } from '../../hooks/useCarouselRing';
import SHOTS from '../../data/shots';
import './Carousel.css';

/**
 * The centrepiece — 37 cards on a 3D perspective ring.
 * All animation is refs + rAF, no re-renders.
 */
export default function Carousel() {
  const cardRefs = useRef([]);

  const setCardRef = useCallback((index, el) => {
    cardRefs.current[index] = el;
  }, []);

  useCarouselRing(cardRefs);

  const cards = [];
  for (let i = 0; i < N; i++) {
    const d = SHOTS[i % 10];
    cards.push(
      <Card key={i} index={i} shotData={d} setRef={setCardRef} />
    );
  }

  return (
    <div className="showcase">
      <div className="ring" id="ring">
        {cards}
      </div>
    </div>
  );
}
