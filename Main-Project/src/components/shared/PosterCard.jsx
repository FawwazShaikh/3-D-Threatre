import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './PosterCard.css';

/**
 * PosterCard — reusable movie/event card with shared-element layoutId.
 * Hover: scale + shadow lift. Click: navigate to detail.
 */
export default function PosterCard({ title, index = 0 }) {
  const navigate = useNavigate();

  return (
    <motion.article
      className="poster-card"
      layoutId={`poster-${title.id}`}
      onClick={() => navigate(`/title/${title.id}`)}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 0.61, 0.36, 1] }}
      whileHover={{ y: -6 }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/title/${title.id}`); }}
    >
      <div className="poster-img-wrap">
        <img
          src={title.poster}
          alt={`Poster for ${title.title}`}
          loading="lazy"
          decoding="async"
        />
        {title.rating && (
          <div className="poster-rating">
            <span className="star">★</span> {title.rating}
          </div>
        )}
        {title.certificate && (
          <div className="poster-cert">{title.certificate}</div>
        )}
      </div>
      <div className="poster-info">
        <h3 className="poster-title">{title.title}</h3>
        <p className="poster-meta">{title.genre}</p>
        {title.language && <p className="poster-lang">{title.language}</p>}
      </div>
    </motion.article>
  );
}
