import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useBookingStore from '../state/bookingStore';
import { fetchTitle, fetchAuditorium } from '../lib/api';
import { calculatePrice, formatINR } from '../lib/pricing';
import { buildSeatMap } from '../lib/seatScore';
import SeatMap2D from '../components/seatmap/SeatMap2D';
import SeatMap3D from '../components/seatmap/SeatMap3D';
import ViewToggle from '../components/seatmap/ViewToggle';
import './SeatSelect.css';

export default function SeatSelect() {
  const { titleId, showtimeId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState(null);
  const [layout, setLayout] = useState(null);
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const viewMode = useBookingStore((s) => s.viewMode);

  // Find showtime info
  const showtime = useMemo(
    () => title?.showtimes?.find((st) => st.id === showtimeId),
    [title, showtimeId]
  );

  useEffect(() => {
    fetchTitle(titleId).then(setTitle).catch(() => navigate('/listings'));
  }, [titleId, navigate]);

  useEffect(() => {
    if (showtime?.auditoriumId) {
      fetchAuditorium(showtime.auditoriumId).then(setLayout);
    }
  }, [showtime]);

  // Build seat map for pricing
  const seatMap = useMemo(() => layout ? buildSeatMap(layout) : null, [layout]);

  // Calculate totals
  const selectedList = useMemo(() => Array.from(selectedSeats), [selectedSeats]);
  const totalPrice = useMemo(() => {
    if (!seatMap || !layout) return 0;
    return selectedList.reduce((sum, seatId) => {
      const seat = seatMap.get(seatId);
      if (!seat) return sum;
      return sum + calculatePrice(seat.score.finalScore, layout.pricing);
    }, 0);
  }, [selectedList, seatMap, layout]);

  if (!title || !layout) {
    return <div className="seat-page"><div className="seat-loading"><div className="seat-spinner" /></div></div>;
  }

  return (
    <div className="seat-page">
      {/* Header */}
      <header className="seat-header">
        <Link to={`/title/${titleId}`} className="seat-back" aria-label="Back to details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="seat-header-info">
          <div className="seat-header-title">{title.title}</div>
          <div className="seat-header-sub">
            {showtime?.time} · {showtime?.format} · {layout.name}
          </div>
        </div>
        <ViewToggle disabled3D={false} />
      </header>

      {/* Seat map area */}
      <div className="seat-map-area">
        {viewMode === '2d' ? (
          <SeatMap2D layout={layout} />
        ) : (
          <SeatMap3D layout={layout} />
        )}
      </div>

      {/* Bottom cart bar */}
      {selectedList.length > 0 && (
        <div className="seat-cart">
          <div className="cart-info">
            <div className="cart-seats">
              {selectedList.map((id) => (
                <span key={id} className="cart-chip">{id}</span>
              ))}
            </div>
            <div className="cart-total">
              {selectedList.length} seat{selectedList.length > 1 ? 's' : ''} · {formatINR(totalPrice)}
            </div>
          </div>
          <button
            className="cart-checkout"
            onClick={() => navigate(`/checkout/${titleId}/${showtimeId}`)}
          >
            Proceed to Checkout
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
