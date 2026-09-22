import { useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Nav from './components/Nav';
import Badge from './components/Badge';
import GlowButton from './components/GlowButton';
import Carousel from './components/Carousel/Carousel';
import BrowserMock from './components/BrowserMock/BrowserMock';
import SupportBubble from './components/SupportBubble';
import useStageScale from './hooks/useStageScale';
import useReducedMotion from './hooks/useReducedMotion';
import './components/Hero.css';

/* ======= STARFIELD GENERATOR ======= */
function genStars(count, blur, amin, amax) {
  const parts = [];
  for (let j = 0; j < count; j++) {
    const x = (Math.random() * 100).toFixed(1);
    const y = (Math.random() * 100).toFixed(1);
    const a = (amin + Math.random() * (amax - amin)).toFixed(2);
    parts.push(`${x}vw ${y}vh ${blur}px 0 rgba(255,255,255,${a})`);
  }
  return parts.join(',');
}

/* ======= ENTRANCE TIMELINE via Element.animate() ======= */
function runEntrance(reduced) {
  const html = document.documentElement;
  if (!html.classList.contains('intro')) return;
  if (reduced || !Element.prototype.animate) {
    html.classList.remove('intro');
    return;
  }

  const D = window.innerWidth <= 700 ? 0.66 : 1;
  const EXPO = 'cubic-bezier(.16,1,.3,1)';
  const SOFT = 'cubic-bezier(.22,.61,.36,1)';
  const Y = (px) => '0 ' + (px * D) + 'px';
  const anims = [];

  function play(el, from, dur, delay, ease) {
    if (!el) return;
    const to = {};
    for (const p in from) {
      to[p] = p === 'opacity' ? 1
        : p === 'scale' ? '1'
        : p === 'translate' ? '0 0'
        : p === 'clipPath' ? 'inset(0 0 -30% 0)'
        : 'none';
    }
    const a = el.animate([from, to], {
      duration: dur, delay, easing: ease, fill: 'both',
    });
    anims.push(a);
  }

  function settle() {
    anims.forEach((a) => a.cancel());
    html.classList.remove('intro');
  }

  // Choreography — exact timing from spec
  play(document.querySelector('.nav'), { opacity: 0, translate: Y(-9) }, 620, 60, EXPO);
  play(document.querySelector('.mark'), { opacity: 0, translate: Y(6) }, 520, 150, SOFT);
  play(document.querySelector('.wm'), { opacity: 0, translate: Y(6) }, 520, 185, SOFT);
  const links = document.querySelectorAll('.links a');
  links.forEach((el, i) => {
    play(el, { opacity: 0, translate: Y(6) }, 460, 215 + i * 45, SOFT);
  });
  play(document.querySelector('.burger'), { opacity: 0, translate: Y(6) }, 460, 300, SOFT);
  play(document.querySelector('.nav .btn'), { opacity: 0, translate: Y(6) }, 500, 400, SOFT);
  play(document.querySelector('.badge'), { opacity: 0, translate: Y(11), scale: '.985' }, 560, 270, EXPO);
  play(document.getElementById('h1a'), { opacity: 0, translate: Y(15), clipPath: 'inset(100% 0 -30% 0)' }, 900, 380, EXPO);
  play(document.getElementById('h1b'), { opacity: 0, translate: Y(15), clipPath: 'inset(100% 0 -30% 0)' }, 900, 470, EXPO);
  play(document.getElementById('sub1'), { opacity: 0, translate: Y(10) }, 620, 690, EXPO);
  play(document.getElementById('sub2'), { opacity: 0, translate: Y(10) }, 620, 745, EXPO);
  play(document.querySelector('.cta2'), { opacity: 0, translate: Y(13), scale: '.985' }, 620, 830, EXPO);
  play(document.querySelector('.ring'), { opacity: 0, translate: Y(18), scale: '.99' }, 950, 700, EXPO);
  play(document.querySelector('.browser'), { opacity: 0, translate: Y(26) }, 900, 900, EXPO);
  play(document.querySelector('.wa'), { opacity: 0, scale: '.88' }, 500, 1260, EXPO);

  setTimeout(settle, 4000);
}

export default function App() {
  const canvasRef = useRef(null);
  const starsARef = useRef(null);
  const starsBRef = useRef(null);
  const reduced = useReducedMotion();
  const navigate = useNavigate();

  // Memoize star shadows so they don't regenerate on re-renders
  const starsA = useMemo(() => genStars(150, 0, 0.05, 0.30), []);
  const starsB = useMemo(() => genStars(18, 1.2, 0.35, 0.70), []);

  // Apply starfield box-shadows once after mount
  useEffect(() => {
    if (starsARef.current) starsARef.current.style.boxShadow = starsA;
    if (starsBRef.current) starsBRef.current.style.boxShadow = starsB;
  }, [starsA, starsB]);

  // Type-fitter element refs — lazy getters to avoid stale refs
  const typeRefs = useMemo(() => ({
    get h1a() { return document.getElementById('h1a'); },
    get h1b() { return document.getElementById('h1b'); },
    get sub1() { return document.getElementById('sub1'); },
    get sub2() { return document.getElementById('sub2'); },
    get badgeTxt() { return document.getElementById('badgeTxt'); },
    get wmName() { return document.getElementById('wmName'); },
    get ctaLabel() { return document.getElementById('ctaLabel'); },
    get vpLabel() { return document.getElementById('vpLabel'); },
    get linksEl() { return document.getElementById('links'); },
  }), []);

  // Wire the scale law
  useStageScale(canvasRef, typeRefs, null);

  // Run entrance timeline once after first paint
  useEffect(() => {
    // Small delay to ensure DOM is painted and fonts are loading
    const raf = requestAnimationFrame(() => runEntrance(reduced));
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="stage">
      <div className="canvas" id="canvas" ref={canvasRef}>
        {/* Background */}
        <div className="bg" />
        <div className="stars" ref={starsARef} />
        <div className="stars" ref={starsBRef} />

        {/* CAROUSEL — z-index 5 */}
        <Carousel />

        {/* BROWSER MOCK — z-index 100, paints IN FRONT of ring */}
        <BrowserMock />

        {/* STACK — z-index 300 */}
        <div className="stack">
          <Nav />
          <Badge />

          {/* Hero headlines */}
          <div className="h1 l1" id="h1a">Book your next</div>
          <div className="h1" id="h1b">Show</div>

          {/* Sublines */}
          <div className="sub s1" id="sub1">
            <b>Movies, plays, events, sports —</b> pick seats together
          </div>
          <div className="sub" id="sub2">
            and lock them in before anyone else does.
          </div>

          {/* Hero CTA */}
          <a className="btn cta2" onClick={(e)=>{e.preventDefault();navigate('/listings');}}><span id="vpLabel">Find showtimes</span></a>
        </div>
      </div>

      {/* Support bubble — outside canvas, inside stage */}
      <SupportBubble />
    </div>
  );
}
