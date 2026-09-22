import { useCallback, memo } from 'react';
import useBookingStore from '../../state/bookingStore';
import { calculatePrice, formatINR, getTier } from '../../lib/pricing';
import './Seat.css';

/**
 * Seat — individual 2D seat button.
 * Shows animated state: available, mine, friend-pick, friend-hover, booked.
 * Pulse animation on pick; reduced-motion: instant color change.
 */
const Seat = memo(function Seat({ seat, layout, rowIdx, showScore, isAfterAisle, onKeyNav, onAnnounce }) {
  const selectSeat = useBookingStore((s) => s.selectSeat);
  const getSeatState = useBookingStore((s) => s.getSeatState);
  const getFriendColor = useBookingStore((s) => s.getFriendColor);

  const state = getSeatState(seat.seatId);
  const friendColor = getFriendColor(seat.seatId);
  const tier = getTier(seat.score.finalScore);
  const price = calculatePrice(seat.score.finalScore, layout.pricing);
  const disabled = state === 'booked' || state === 'held';

  const handleClick = useCallback(() => {
    if (disabled) return;
    selectSeat(seat.seatId);
    const newState = state === 'mine' ? 'deselected' : 'selected';
    onAnnounce(
      `${seat.rowName}, Seat ${seat.seatNum} — ${seat.score.tierName}, ${formatINR(price)}, view score ${seat.score.finalScore}. ${newState === 'selected' ? 'Selected.' : 'Deselected.'}`
    );
  }, [seat, state, disabled, selectSeat, onAnnounce, price]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    } else {
      onKeyNav(e, seat.seatId, rowIdx, seat.col);
    }
  }, [handleClick, onKeyNav, seat, rowIdx]);

  // Color based on state or score overlay
  let seatColor;
  let seatClass = `seat ${state}`;

  if (showScore && state === 'available') {
    seatClass += ` tier-${tier}`;
  }
  if (state === 'friend-pick' || state === 'friend-hover') {
    seatColor = friendColor;
  }

  return (
    <button
      className={seatClass}
      style={seatColor ? { '--friend-color': seatColor } : undefined}
      data-row={rowIdx}
      data-col={seat.col}
      data-seat={seat.seatId}
      data-aisle={isAfterAisle ? '' : undefined}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={rowIdx === 0 && seat.col === 0 ? 0 : -1}
      role="gridcell"
      aria-label={`${seat.rowName}, Seat ${seat.seatNum}, ${seat.score.tierName}, ${formatINR(price)}, score ${seat.score.finalScore}, ${state}`}
      aria-selected={state === 'mine'}
      title={`${seat.seatId} — ${seat.score.tierName} · Score ${seat.score.finalScore} · ${formatINR(price)}`}
    >
      <span className="seat-num">{seat.seatNum}</span>
    </button>
  );
});

export default Seat;
