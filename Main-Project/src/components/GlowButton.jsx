import './GlowButton.css';

/**
 * PIXEL CONTRACT B — Glow Button
 * Near-black button with cyan light pooled at the FOOT, clipped by overflow:hidden.
 * Two variants: "nav" (has ::before streak) and "hero" (no streak).
 * Always an <a> with inner <span>, never a <button>.
 */
export default function GlowButton({ variant = 'nav', id, children, className = '' }) {
  const cls = variant === 'hero' ? `btn cta2 ${className}` : `btn ${className}`;
  return (
    <a href="#" className={cls}>
      <span id={id}>{children}</span>
    </a>
  );
}
