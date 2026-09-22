import useReducedMotion from '../hooks/useReducedMotion';
import './SupportBubble.css';

export default function SupportBubble() {
  const reduced = useReducedMotion();

  return (
    <a
      href="#"
      className={`wa${reduced ? ' no-pulse' : ''}`}
      aria-label="Need help booking?"
    >
      <svg viewBox="0 0 32 32" fill="#fff">
        <path d="M16 3C8.82 3 3 8.28 3 14.8c0 3.66 1.88 6.93 4.83 9.16L6.6 28.5a.75.75 0 0 0 1.08.78l5.4-2.78c.95.18 1.92.27 2.92.27 7.18 0 13-5.28 13-11.8S23.18 3 16 3Zm-4.8 14.4a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Zm4.8 0a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Zm4.8 0a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Z" />
      </svg>
    </a>
  );
}
