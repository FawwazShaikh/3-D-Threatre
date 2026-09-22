import { useMemo, useCallback, useRef, useEffect } from 'react';
import useBookingStore from '../../state/bookingStore';
import { buildSeatMap } from '../../lib/seatScore';
import { calculatePrice, formatINR, getTier, TIERS } from '../../lib/pricing';
import Seat from './Seat';
import SeatLegend from './SeatLegend';
import './SeatMap2D.css';

/**
 * SeatMap2D — accessible grid of seats.
 * Arrow keys move focus, Enter/Space selects, roving tabindex.
 * Heat overlay (view quality) toggle.
 */
export default function SeatMap2D({ layout }) {
  const gridRef = useRef(null);
  const announceRef = useRef(null);
  const showScoreOverlay = useBookingStore((s) => s.showScoreOverlay);

  // Build the full seat map from layout
  const seatMap = useMemo(() => buildSeatMap(layout), [layout]);

  // Group seats by row for grid rendering
  const rows = useMemo(() => {
    const rowMap = new Map();
    for (const [, seat] of seatMap) {
      const rowKey = seat.rowName;
      if (!rowMap.has(rowKey)) rowMap.set(rowKey, []);
      rowMap.get(rowKey).push(seat);
    }
    // Sort seats within each row by column
    for (const [, seats] of rowMap) seats.sort((a, b) => a.col - b.col);
    return Array.from(rowMap.entries());
  }, [seatMap]);

  // Announce seat state changes for screen readers
  const announce = useCallback((msg) => {
    if (announceRef.current) announceRef.current.textContent = msg;
  }, []);

  // Keyboard navigation — roving tabindex
  const handleKeyDown = useCallback((e, seatId, rowIdx, colIdx) => {
    let targetRow = rowIdx;
    let targetCol = colIdx;

    switch (e.key) {
      case 'ArrowRight': targetCol++; break;
      case 'ArrowLeft': targetCol--; break;
      case 'ArrowDown': targetRow++; break;
      case 'ArrowUp': targetRow--; break;
      default: return;
    }
    e.preventDefault();

    // Find the target seat button
    const grid = gridRef.current;
    if (!grid) return;
    const target = grid.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
    if (target) target.focus();
  }, []);

  return (
    <div className="seatmap-2d">
      {/* Screen indicator */}
      <div className="screen-indicator">
        <div className="screen-bar" />
        <span className="screen-label">SCREEN</span>
      </div>

      {/* Seat grid */}
      <div className="seat-grid" ref={gridRef} role="grid" aria-label="Seat map">
        {rows.map(([rowName, seats], rowIdx) => (
          <div key={rowName} className="seat-row" role="row">
            <span className="row-label" aria-hidden="true">
              {layout.rowLetters[rowIdx]}
            </span>
            <div className="row-seats">
              {seats.map((seat) => {
                // Detect aisle gaps
                const isAfterAisle =
                  seat.col === layout.blocks[1].start || // left aisle
                  seat.col === layout.blocks[2].start;   // right aisle

                return (
                  <Seat
                    key={seat.seatId}
                    seat={seat}
                    layout={layout}
                    rowIdx={rowIdx}
                    showScore={showScoreOverlay}
                    isAfterAisle={isAfterAisle}
                    onKeyNav={handleKeyDown}
                    onAnnounce={announce}
                  />
                );
              })}
            </div>
            <span className="row-label right" aria-hidden="true">
              {layout.rowLetters[rowIdx]}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <SeatLegend />

      {/* aria-live region */}
      <div
        ref={announceRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}
