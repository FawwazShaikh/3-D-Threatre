import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchTitle } from '../lib/api';
import './TitleDetail.css';

export default function TitleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  useEffect(() => {
    fetchTitle(id).then(setTitle).catch(() => navigate('/listings'));
  }, [id, navigate]);

  if (!title) {
    return <div className="detail-loading"><div className="detail-spinner" /></div>;
  }

  return (
    <div className="detail-page">
      {/* Hero backdrop with shared element */}
      <div className="detail-hero">
        <motion.div className="detail-poster-wrap" layoutId={`poster-${title.id}`}>
          <img src={title.backdrop || title.poster} alt={title.title} />
        </motion.div>
        <div className="detail-hero-scrim" />
        <div className="detail-hero-content">
          <Link to="/listings" className="detail-back" aria-label="Back to listings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Title info */}
      <div className="detail-body">
        <div className="detail-meta-row">
          {title.certificate && <span className="detail-cert">{title.certificate}</span>}
          {title.rating && <span className="detail-rating">★ {title.rating}</span>}
          {title.duration && <span className="detail-duration">{title.duration}</span>}
        </div>

        <h1 className="detail-title">{title.title}</h1>
        <p className="detail-genre">{title.genre}{title.language ? ` · ${title.language}` : ''}</p>

        <p className="detail-synopsis">{title.synopsis}</p>

        {title.cast && title.cast.length > 0 && (
          <div className="detail-cast">
            <h3>Cast</h3>
            <div className="detail-cast-list">
              {title.cast.map((name, i) => (
                <span key={i} className="detail-cast-chip">{name}</span>
              ))}
            </div>
          </div>
        )}

        {title.director && (
          <div className="detail-director">
            <h3>Director</h3>
            <span>{title.director}</span>
          </div>
        )}

        {/* Showtimes */}
        <div className="detail-showtimes">
          <h2>Showtimes</h2>
          <p className="detail-venue">Marquee Cinemas, Lower Parel · Mumbai</p>
          <div className="detail-showtime-grid">
            {title.showtimes.map((st) => (
              <button
                key={st.id}
                className={`showtime-chip${selectedShowtime === st.id ? ' selected' : ''}`}
                onClick={() => setSelectedShowtime(st.id)}
              >
                <span className="showtime-time">{st.time}</span>
                <span className="showtime-format">{st.format}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Book CTA */}
        <motion.button
          className="detail-book-cta"
          disabled={!selectedShowtime}
          onClick={() => navigate(`/seats/${title.id}/${selectedShowtime}`)}
          whileHover={selectedShowtime ? { y: -2 } : {}}
          whileTap={selectedShowtime ? { scale: 0.97 } : {}}
        >
          {selectedShowtime ? 'Select Seats' : 'Pick a showtime'}
          {selectedShowtime && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </motion.button>

        {/* Seat Sync notice */}
        <div className="detail-sync-notice">
          <span className="sync-icon">⚡</span>
          Share the booking link with friends — their seat picks will sync live on your map.
        </div>
      </div>
    </div>
  );
}
