import { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchTitle, fetchAuditorium } from '../lib/api';
import { buildSeatMap } from '../lib/seatScore';
import { calculatePrice, formatINR, getTier, TIERS } from '../lib/pricing';
import useBookingStore from '../state/bookingStore';
import './Confirmation.css';

export default function Confirmation() {
  const { titleId, showtimeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [title, setTitle] = useState(null);
  const [layout, setLayout] = useState(null);
  const clearSelection = useBookingStore((s) => s.clearSelection);

  const seats = location.state?.seats || [];
  const total = location.state?.total || 0;

  useEffect(() => { fetchTitle(titleId).then(setTitle); }, [titleId]);
  useEffect(() => {
    if (title?.showtimes) {
      const st = title.showtimes.find((s) => s.id === showtimeId);
      if (st) fetchAuditorium(st.auditoriumId).then(setLayout);
    }
  }, [title, showtimeId]);

  // Clear selection on mount (booking complete)
  useEffect(() => { clearSelection(); }, [clearSelection]);

  const showtime = useMemo(
    () => title?.showtimes?.find((st) => st.id === showtimeId),
    [title, showtimeId]
  );
  const seatMap = useMemo(() => layout ? buildSeatMap(layout) : null, [layout]);

  const seatDetails = useMemo(() => {
    if (!seatMap || !layout) return [];
    return seats.map((seatId) => {
      const seat = seatMap.get(seatId);
      if (!seat) return null;
      return { ...seat, price: calculatePrice(seat.score.finalScore, layout.pricing), tier: getTier(seat.score.finalScore) };
    }).filter(Boolean);
  }, [seats, seatMap, layout]);

  const bookingId = useMemo(() => 'MQ-' + Date.now().toString(36).toUpperCase(), []);

  if (!title) {
    return <div className="conf-page"><div className="conf-loading"><div className="conf-spinner" /></div></div>;
  }

  return (
    <div className="conf-page">
      <div className="conf-body">
        <motion.div
          className="conf-success"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="conf-check">✓</div>
          <h1>Booking Confirmed!</h1>
          <p className="conf-booking-id">Booking ID: {bookingId}</p>
        </motion.div>

        {/* Ticket card */}
        <motion.div
          className="conf-ticket"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="ticket-header">
            <img src={title.poster} alt={title.title} className="ticket-poster" />
            <div>
              <h2 className="ticket-title">{title.title}</h2>
              <p className="ticket-meta">{showtime?.time} · {showtime?.format}</p>
              <p className="ticket-venue">{layout?.name || 'Grand Luxury Auditorium'}</p>
              <p className="ticket-venue">{layout?.venue || 'Marquee Cinemas'}</p>
            </div>
          </div>

          <div className="ticket-divider">
            <div className="ticket-notch left" />
            <div className="ticket-dash" />
            <div className="ticket-notch right" />
          </div>

          <div className="ticket-seats">
            <div className="ticket-label">YOUR SEATS</div>
            <div className="ticket-seat-chips">
              {seatDetails.map((s) => (
                <div key={s.seatId} className={`ticket-chip tier-${s.tier}`}>
                  <span className="ticket-chip-code">{s.seatId}</span>
                  <span className="ticket-chip-tier">{TIERS[s.tier].label}</span>
                  <span className="ticket-chip-score">Score {s.score.finalScore}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ticket-footer">
            <div>
              <div className="ticket-label">TOTAL PAID</div>
              <div className="ticket-total">{formatINR(total)}</div>
            </div>
            <div>
              <div className="ticket-label">BOOKING ID</div>
              <div className="ticket-total">{bookingId}</div>
            </div>
          </div>

          {/* View from your seat placeholder — Phase 9 */}
          <div className="ticket-view-section">
            <div className="ticket-label">VIEW FROM YOUR SEAT</div>
            <div className="ticket-view-placeholder">
              🎬 3D POV snapshot will render here (Phase 9)
            </div>
          </div>
        </motion.div>

        <div className="conf-actions">
          <Link to="/" className="conf-action-btn primary">
            Back to Home
          </Link>
          <Link to="/listings" className="conf-action-btn secondary">
            Book Another Show
          </Link>
        </div>
      </div>
    </div>
  );
}
