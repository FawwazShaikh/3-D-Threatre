import './Badge.css';

/**
 * PIXEL CONTRACT A — Badge
 * Fixed 250×39 box, icon tile pinned left, left-aligned label beside it.
 */
export default function Badge() {
  return (
    <div className="badge">
      <i>
        <svg
          viewBox="5 1 14 22"
          preserveAspectRatio="none"
          fill="rgba(16,112,152,.72)"
          stroke="rgba(190,236,255,.6)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <path d="M13.9 1.6 5.5 13.6a.7.7 0 0 0 .6 1.1h4.2l-1 7.7a.7.7 0 0 0 1.25.55l8.3-12.1a.7.7 0 0 0-.6-1.1h-4.2l1-7.7a.7.7 0 0 0-1.25-.55Z" />
        </svg>
      </i>
      <b id="badgeTxt">Book together — seats sync live with friends</b>
    </div>
  );
}
