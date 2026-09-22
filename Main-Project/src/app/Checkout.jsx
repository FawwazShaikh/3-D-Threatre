import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useBookingStore from '../state/bookingStore';
import { fetchTitle, fetchAuditorium } from '../lib/api';
import { buildSeatMap } from '../lib/seatScore';
import { calculatePrice, formatINR, getTier, TIERS } from '../lib/pricing';
import './Checkout.css';

export default function Checkout() {
  const { titleId, showtimeId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState(null);
  const [layout, setLayout] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const clearSelection = useBookingStore((s) => s.clearSelection);

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

  const seatMap = useMemo(() => (layout ? buildSeatMap(layout) : null), [layout]);
  const selectedList = useMemo(() => Array.from(selectedSeats), [selectedSeats]);

  const seatDetails = useMemo(() => {
    if (!seatMap || !layout) return [];
    return selectedList.map((seatId) => {
      const seat = seatMap.get(seatId);
      if (!seat) return null;
      const price = calculatePrice(seat.score.finalScore, layout.pricing);
      const tier = getTier(seat.score.finalScore);
      return { ...seat, price, tier };
    }).filter(Boolean);
  }, [selectedList, seatMap, layout]);

  const totalPrice = useMemo(
    () => seatDetails.reduce((sum, s) => sum + s.price, 0),
    [seatDetails]
  );

  const convenienceFee = Math.round(totalPrice * 0.035);
  const grandTotal = totalPrice + convenienceFee;

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));
    // 90% success
    const success = Math.random() < 0.9;
    if (success) {
      navigate(`/confirmation/${titleId}/${showtimeId}`, { state: { seats: selectedList, total: grandTotal } });
    } else {
      setProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  if (!title || !layout || selectedList.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <p>No seats selected.</p>
          <Link to={`/seats/${titleId}/${showtimeId}`}>← Back to seat map</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link to={`/seats/${titleId}/${showtimeId}`} className="checkout-back" aria-label="Back to seat selection">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1>Checkout</h1>
      </header>

      <div className="checkout-body">
        {/* Order summary */}
        <div className="checkout-card">
          <h2 className="checkout-section-title">Order Summary</h2>
          <div className="checkout-movie">
            <img src={title.poster} alt={title.title} className="checkout-poster" />
            <div>
              <div className="checkout-movie-title">{title.title}</div>
              <div className="checkout-movie-meta">{showtime?.time} · {showtime?.format}</div>
              <div className="checkout-movie-venue">{layout.name} · {layout.venue}</div>
            </div>
          </div>

          <div className="checkout-seats-list">
            {seatDetails.map((s) => (
              <div key={s.seatId} className="checkout-seat-row">
                <div className="checkout-seat-info">
                  <span className="checkout-seat-code">{s.seatId}</span>
                  <span className={`checkout-tier tier-${s.tier}`}>{TIERS[s.tier].label}</span>
                  <span className="checkout-score">Score {s.score.finalScore}</span>
                </div>
                <span className="checkout-seat-price">{formatINR(s.price)}</span>
              </div>
            ))}
          </div>

          <div className="checkout-divider" />
          <div className="checkout-line">
            <span>Subtotal ({seatDetails.length} seat{seatDetails.length > 1 ? 's' : ''})</span>
            <span>{formatINR(totalPrice)}</span>
          </div>
          <div className="checkout-line sub">
            <span>Convenience fee (3.5%)</span>
            <span>{formatINR(convenienceFee)}</span>
          </div>
          <div className="checkout-divider" />
          <div className="checkout-line total">
            <span>Total</span>
            <span>{formatINR(grandTotal)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="checkout-card">
          <h2 className="checkout-section-title">Payment Method</h2>
          <div className="payment-options">
            {[
              { key: 'upi', label: 'UPI', icon: '📱' },
              { key: 'card', label: 'Credit/Debit Card', icon: '💳' },
              { key: 'netbanking', label: 'Net Banking', icon: '🏦' },
            ].map((opt) => (
              <label key={opt.key} className={`payment-opt${paymentMethod === opt.key ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value={opt.key}
                  checked={paymentMethod === opt.key}
                  onChange={() => setPaymentMethod(opt.key)}
                />
                <span className="payment-icon">{opt.icon}</span>
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Pay button */}
        <motion.button
          className="checkout-pay"
          onClick={handlePayment}
          disabled={processing}
          whileHover={!processing ? { y: -2 } : {}}
          whileTap={!processing ? { scale: 0.97 } : {}}
        >
          {processing ? (
            <><div className="pay-spinner" /> Processing…</>
          ) : (
            <>Pay {formatINR(grandTotal)}</>
          )}
        </motion.button>

        <p className="checkout-disclaimer">
          This is a demo. No real payment will be charged.
        </p>
      </div>
    </div>
  );
}
