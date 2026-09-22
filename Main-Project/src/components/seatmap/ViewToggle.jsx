import { motion } from 'framer-motion';
import useBookingStore from '../../state/bookingStore';
import './ViewToggle.css';

/**
 * ViewToggle — 2D | 3D segmented control with animated pill.
 */
export default function ViewToggle({ disabled3D = false }) {
  const viewMode = useBookingStore((s) => s.viewMode);
  const setViewMode = useBookingStore((s) => s.setViewMode);

  return (
    <div className="view-toggle" role="tablist" aria-label="Map view mode">
      <button
        role="tab"
        aria-selected={viewMode === '2d'}
        className={`vt-btn${viewMode === '2d' ? ' active' : ''}`}
        onClick={() => setViewMode('2d')}
      >
        {viewMode === '2d' && <motion.div className="vt-pill" layoutId="vt-pill" />}
        <span className="vt-label">2D</span>
      </button>
      <button
        role="tab"
        aria-selected={viewMode === '3d'}
        className={`vt-btn${viewMode === '3d' ? ' active' : ''}${disabled3D ? ' disabled' : ''}`}
        onClick={() => !disabled3D && setViewMode('3d')}
        disabled={disabled3D}
        title={disabled3D ? '3D view not available on this device' : 'Switch to 3D view'}
      >
        {viewMode === '3d' && <motion.div className="vt-pill" layoutId="vt-pill" />}
        <span className="vt-label">3D</span>
        {!disabled3D && <span className="vt-badge">CINEMAVIEW</span>}
      </button>
    </div>
  );
}
