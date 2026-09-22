import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './Layout.css';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="app-root">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="page-wrapper"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
