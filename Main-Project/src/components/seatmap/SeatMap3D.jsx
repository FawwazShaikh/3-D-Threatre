import { useRef, useEffect, useCallback, useState, Suspense, lazy } from 'react';
import useBookingStore from '../../state/bookingStore';
import './SeatMap3D.css';

/**
 * SeatMap3D — React wrapper for the CINEMAVIEW 3D scene.
 * - Lazy-loads Three.js + createScene on mount
 * - Subscribes to Zustand store for seat state changes
 * - Provides tooltip overlay for hovered seats
 * - DPR cap: min(devicePixelRatio, 2) desktop, 1.5 mobile
 * - Context loss: fallback to 2D with notice
 */
export default function SeatMap3D({ layout }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraMode, setCameraMode] = useState('OVERVIEW');

  const selectSeat = useBookingStore((s) => s.selectSeat);
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const bookedSeats = useBookingStore((s) => s.bookedSeats);
  const friendPicks = useBookingStore((s) => s.friendPicks);
  const getSeatState = useBookingStore((s) => s.getSeatState);

  // Init scene
  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamic import for code splitting
    import('./cinemaview/createScene.js').then(({ default: createScene }) => {
      if (!mounted) return;
      try {
        const scene = createScene(canvas, {
          onSeatHover: (data) => {
            if (!mounted) return;
            if (data) {
              setTooltip({
                seatCode: data.seatCode,
                rowName: data.rowName,
                seatNum: data.seatNum,
                blockName: data.blockName,
                score: data.stats.finalScore,
                tierName: data.stats.tierName,
                price: data.stats.finalPrice,
                tierHex: `#${data.stats.tierHex.toString(16).padStart(6, '0')}`,
              });
            } else {
              setTooltip(null);
            }
          },
          onSeatClick: (data) => {
            if (!mounted) return;
            selectSeat(data.seatCode);
          },
          onModeChange: (mode) => {
            if (!mounted) return;
            setCameraMode(mode);
          },
        });
        sceneRef.current = scene;
        setLoading(false);
      } catch (err) {
        console.error('CINEMAVIEW init failed:', err);
        setError(err.message);
      }
    }).catch((err) => {
      console.error('Three.js load failed:', err);
      setError('Failed to load 3D viewer');
    });

    return () => {
      mounted = false;
      if (sceneRef.current) {
        sceneRef.current.cleanup();
        sceneRef.current = null;
      }
    };
  }, [selectSeat]);

  // Sync seat states from store → 3D scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const allSeatData = scene.getSeatDataArray();
    for (const data of allSeatData) {
      if (!data) continue;
      const state = getSeatState(data.seatCode);
      scene.setSeatState(data.seatCode, state);
    }
  }, [selectedSeats, bookedSeats, friendPicks, getSeatState]);

  // Camera preset controls
  const handleOverview = useCallback(() => {
    sceneRef.current?.switchToOverviewMode();
  }, []);

  if (error) {
    return (
      <div className="seatmap-3d-error">
        <p>⚠️ 3D view unavailable: {error}</p>
        <p>Switch to 2D view to continue.</p>
      </div>
    );
  }

  return (
    <div className="seatmap-3d-wrap">
      <canvas ref={canvasRef} className="seatmap-3d-canvas" />

      {loading && (
        <div className="seatmap-3d-loader">
          <div className="s3d-spinner" />
          <p>Loading CINEMAVIEW 3D…</p>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="s3d-tooltip">
          <div className="s3d-tooltip-code">{tooltip.seatCode}</div>
          <div className="s3d-tooltip-row">{tooltip.rowName} · Seat {tooltip.seatNum}</div>
          <div className="s3d-tooltip-block">{tooltip.blockName}</div>
          <div className="s3d-tooltip-score" style={{ color: tooltip.tierHex }}>
            {tooltip.tierName} · Score {tooltip.score}
          </div>
          <div className="s3d-tooltip-price">₹{tooltip.price}</div>
        </div>
      )}

      {/* Camera mode indicator */}
      {cameraMode === 'SEAT_PREVIEW' && (
        <div className="s3d-mode-bar">
          <span>👁️ Seat POV Mode — click empty space or</span>
          <button onClick={handleOverview}>Exit POV</button>
        </div>
      )}

      {/* Controls hint */}
      <div className="s3d-controls-hint">
        <span>🖱️ Drag to orbit · Scroll to zoom · Click seat to select</span>
      </div>
    </div>
  );
}
