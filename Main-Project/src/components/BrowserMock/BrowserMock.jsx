import BookingPage from './BookingPage';
import './BrowserMock.css';

export default function BrowserMock() {
  return (
    <div className="browser">
      <div className="bar">
        <div className="dots">
          <i style={{ background: '#ee5c62' }} />
          <i style={{ background: '#f6b719' }} />
          <i style={{ background: '#12c02f' }} />
        </div>
        <div className="omni">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.8-3.8" />
          </svg>
          <span>Marquee — Mumbai ▾</span>
        </div>
        <div className="tools">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
            <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7" />
            <polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
      </div>
      <div className="page">
        <BookingPage />
      </div>
    </div>
  );
}
