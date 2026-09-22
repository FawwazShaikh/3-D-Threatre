import { useCallback } from 'react';
import getCreative from './creatives';

/**
 * Individual carousel card — renders creative content + edge overlay.
 * Uses forwardRef-free pattern: parent passes a callback ref setter.
 */
export default function Card({ shotData, setRef, index }) {
  const handleImgError = useCallback((e) => {
    e.target.closest('.card')?.classList.add('broken');
  }, []);

  return (
    <div
      className="card"
      ref={(el) => setRef(index, el)}
    >
      <CardContent shotData={shotData} onImgError={handleImgError} />
      <div className="edge" />
    </div>
  );
}

/** Wraps the creative content and attaches error handlers to all imgs */
function CardContent({ shotData, onImgError }) {
  // We need to clone the creative JSX and attach onError to img elements
  // The creative already returns JSX with <img> elements
  // We'll use a wrapper div that captures img errors via event delegation
  return (
    <div
      style={{ position: 'absolute', inset: 0 }}
      onError={onImgError}
    >
      {getCreative(shotData)}
    </div>
  );
}
