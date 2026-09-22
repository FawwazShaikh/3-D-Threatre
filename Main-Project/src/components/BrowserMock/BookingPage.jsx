import { HERO_BANNER_URL, POSTER_URLS } from '../../data/shots';
import './BookingPage.css';

const TITLES = [
  { tag: 'TRENDING',     name: 'Northlight',      meta: 'Thriller · Hindi, Eng', rating: '★ 8.2' },
  { tag: 'FILLING FAST', name: 'Sunset Renewal',   meta: 'Drama · 2h 10m',       rating: '★ 7.9' },
  { tag: 'PREMIERE',     name: 'Afterglow',        meta: 'Comedy · 3D',           rating: '★ 8.5' },
  { tag: 'LAST DAY',     name: 'The Long Take',    meta: 'Documentary',           rating: '★ 8.0' },
];

export default function BookingPage() {
  return (
    <>
      {/* Announcement bar */}
      <div className="ann">
        <u style={{ left: 20 }}>‹</u>
        <span>Book together — seats sync live</span>
        <u style={{ right: 20 }}>›</u>
      </div>

      {/* Logo */}
      <div className="shoplogo">
        <em>MARQUEE</em>
        <i>BOOK TICKETS</i>
      </div>

      {/* Icons */}
      <div className="shopicons">
        <svg viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.8-3.8" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2">
          <circle cx="12" cy="8" r="4" /><path d="M4.5 21c0-4.2 3.4-6.6 7.5-6.6s7.5 2.4 7.5 6.6" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2">
          <path d="M5.5 8h13l-1.2 12H6.7L5.5 8Z" /><path d="M9 8V6.2A3 3 0 0 1 15 6.2V8" />
        </svg>
      </div>

      {/* Page body */}
      <div className="pagebody">
        {/* Hero banner */}
        <div className="pghero">
          <img alt="Wide cinematic still from a Marquee featured show" src={HERO_BANNER_URL} />
          <div className="scrim" />
          <div className="copy">
            <u>Now showing</u>
            <em>Grab seats before<br />the show fills up.</em>
            <i>BOOK NOW</i>
          </div>
        </div>

        {/* Section header */}
        <div className="pgsec">
          <b>Now showing</b>
          <u>view all</u>
        </div>

        {/* Title grid */}
        <div className="pggrid">
          {TITLES.map((t, idx) => (
            <div className="pgcard" key={idx}>
              <div className="ph">
                <img alt={`Poster for ${t.name}`} src={POSTER_URLS[idx]} />
                <div className="tag">{t.tag}</div>
              </div>
              <b>{t.name}</b>
              <i>{t.meta}</i>
              <s>{t.rating}</s>
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div className="pgstrip">
          <span>Instant e-tickets, no printing</span>
          <span>Free cancellation up to 2 hrs</span>
          <span>500+ cities covered</span>
          <span>Zero fee on your first booking</span>
        </div>
      </div>
    </>
  );
}
