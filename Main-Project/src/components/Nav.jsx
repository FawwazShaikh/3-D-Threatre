import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GlowButton from './GlowButton';
import './Nav.css';

const TAB_MAX = 1080, TAB_MIN = 701;

export default function Nav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = useCallback((e) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      const nav = document.getElementById('nav');
      if (open && nav && !nav.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        document.querySelector('.burger')?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Force-close when viewport leaves hamburger band
  useEffect(() => {
    const handler = () => {
      const vw = window.innerWidth;
      if (vw > TAB_MAX || vw < TAB_MIN) setOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <div className={`nav${open ? ' open' : ''}`} id="nav">
      {/* Logo mark */}
      <div className="mark">
        <svg viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="sw" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#8ef4ff" />
              <stop offset=".5" stopColor="#35d8ff" />
              <stop offset="1" stopColor="#0a86d8" />
            </linearGradient>
            <linearGradient id="sw2" x1="40" y1="10" x2="10" y2="40">
              <stop offset="0" stopColor="#a6f7ff" />
              <stop offset="1" stopColor="#0f9ae0" stopOpacity=".25" />
            </linearGradient>
          </defs>
          <g transform="rotate(-32 24 24)">
            <ellipse cx="24" cy="24" rx="18.5" ry="9.6"
              stroke="url(#sw2)" strokeWidth="3.1" strokeLinecap="round"
              strokeDasharray="58 30" strokeDashoffset="14" fill="none" />
            <circle cx="41.4" cy="20.6" r="3.1" fill="#bff6ff" />
          </g>
          <circle cx="24" cy="24" r="6.6" fill="url(#sw)" />
          <circle cx="24" cy="24" r="2.6" fill="#fff" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="wm">
        <div className="kick">TICKETS</div>
        <div className="name" id="wmName">MARQUEE</div>
      </div>

      {/* Nav menu — same nodes for desktop links and mobile panel */}
      <div className="navmenu" id="navmenu" role="menu">
        <div className="links" id="links">
          <a href="/listings?cat=movies" onClick={(e)=>{e.preventDefault();closeMenu();navigate('/listings?cat=movies');}}>Movies</a>
          <a href="/listings?cat=plays" onClick={(e)=>{e.preventDefault();closeMenu();navigate('/listings?cat=plays');}}>Plays</a>
          <a href="/listings?cat=events" onClick={(e)=>{e.preventDefault();closeMenu();navigate('/listings?cat=events');}}>Events</a>
          <a href="/listings?cat=sports" onClick={(e)=>{e.preventDefault();closeMenu();navigate('/listings?cat=sports');}}>Sports</a>
          <a href="/listings" onClick={(e)=>{e.preventDefault();closeMenu();navigate('/listings');}}>Offers</a>
        </div>
        <a className="btn" onClick={(e)=>{e.preventDefault();navigate('/listings');}}><span id="ctaLabel">Book now</span></a>
      </div>

      {/* Burger */}
      <button
        type="button"
        className="burger"
        aria-label="Opens menu"
        aria-expanded={open}
        aria-controls="navmenu"
        onClick={toggle}
      >
        <span /><span /><span />
      </button>
    </div>
  );
}
