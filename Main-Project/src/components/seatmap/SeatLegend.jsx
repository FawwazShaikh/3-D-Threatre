import useBookingStore from '../../state/bookingStore';
import { TIERS } from '../../lib/pricing';
import './SeatLegend.css';

const STATES = [
  { key: 'available', label: 'Available', color: 'rgba(255,255,255,.12)' },
  { key: 'mine', label: 'Your pick', color: 'rgba(14,165,233,.5)' },
  { key: 'friend-pick', label: "Friend's pick", color: '#e67e22' },
  { key: 'booked', label: 'Booked', color: 'rgba(255,255,255,.04)' },
];

export default function SeatLegend() {
  const showScoreOverlay = useBookingStore((s) => s.showScoreOverlay);
  const setShowScoreOverlay = useBookingStore((s) => s.setShowScoreOverlay);

  return (
    <div className="seat-legend">
      <div className="legend-section">
        <div className="legend-items">
          {STATES.map((s) => (
            <div key={s.key} className="legend-item">
              <span className="legend-dot" style={{ background: s.color }} />
              <span className="legend-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        className={`legend-toggle${showScoreOverlay ? ' active' : ''}`}
        onClick={() => setShowScoreOverlay(!showScoreOverlay)}
        aria-pressed={showScoreOverlay}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        View quality
      </button>
      {showScoreOverlay && (
        <div className="legend-tiers">
          {Object.entries(TIERS).map(([key, tier]) => (
            <div key={key} className="legend-item">
              <span className="legend-dot" style={{ background: tier.color }} />
              <span className="legend-label">{tier.label} ({tier.range})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
