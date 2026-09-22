import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchTitles } from '../lib/api';
import PosterCard from '../components/shared/PosterCard';
import './Listings.css';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'movies', label: 'Movies' },
  { key: 'plays', label: 'Plays' },
  { key: 'events', label: 'Events' },
  { key: 'sports', label: 'Sports' },
];

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('cat') || 'all';
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTitles(activeCategory).then((data) => {
      setTitles(data);
      setLoading(false);
    });
  }, [activeCategory]);

  const setCategory = useCallback((key) => {
    if (key === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ cat: key });
    }
  }, [setSearchParams]);

  return (
    <div className="listings-page">
      {/* Top bar */}
      <header className="listings-header">
        <Link to="/" className="listings-back" aria-label="Back to home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="listings-brand">
          <span className="listings-kicker">TICKETS</span>
          <span className="listings-name">MARQUEE</span>
        </div>
        <div className="listings-city">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          Mumbai
        </div>
      </header>

      {/* Category tabs */}
      <nav className="cat-tabs" role="tablist">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            role="tab"
            aria-selected={activeCategory === cat.key}
            className={`cat-tab${activeCategory === cat.key ? ' active' : ''}`}
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
            {activeCategory === cat.key && (
              <motion.div className="cat-pill" layoutId="cat-pill" />
            )}
          </button>
        ))}
      </nav>

      {/* Title grid */}
      <div className="listings-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="poster-skeleton" />
          ))
        ) : titles.length === 0 ? (
          <div className="listings-empty">No shows found in this category.</div>
        ) : (
          titles.map((title, i) => (
            <PosterCard key={title.id} title={title} index={i} />
          ))
        )}
      </div>

      {/* Seat Sync callout */}
      <div className="listings-callout">
        <div className="callout-icon">⚡</div>
        <div>
          <strong>Seat Sync</strong> — Book with friends. See their seat picks update live.
        </div>
      </div>
    </div>
  );
}
