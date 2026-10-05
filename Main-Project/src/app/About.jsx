import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* Navigation Bar */}
        <div className="about-nav-bar">
          <Link to="/">← Back to Marquee Home</Link>
          <a href="./theatre.html" title="Open 3D Theatre Simulator">🏛️ Launch 3D Theatre</a>
        </div>

        {/* Hero */}
        <div className="about-hero">
          <div className="about-badge">About Marquee & 3D CinemaView</div>
          <h1>Software Configuration Management Case Study</h1>
          <p>
            An interactive multi-tiered cinema platform featuring real-time seat synchronization, dynamic pricing, and an authentic Three.js 3D auditorium simulation.
          </p>
        </div>

        {/* Section 1: Overview */}
        <div className="about-section">
          <h2>Platform Overview</h2>
          <p>
            Marquee is a modern ticket booking web application designed to connect moviegoers and live event attendees. It allows users to browse movies, plays, sports events, review showtimes, and select seats using either a streamlined 2D map or an immersive 3D auditorium perspective.
          </p>
          <div className="about-cards-grid">
            <div className="about-card">
              <h3>🎬 Multi-Category Listings</h3>
              <p>Browse current blockbusters, theatrical plays, concerts, and stadium sports with detailed showtime schedules.</p>
            </div>
            <div className="about-card">
              <h3>💺 3D CinemaView Integration</h3>
              <p>Preview exact line-of-sight and angle quality from any seat in a photorealistic 3D auditorium.</p>
            </div>
            <div className="about-card">
              <h3>⚡ Dynamic Pricing</h3>
              <p>Smart algorithmic pricing based on distance, rake elevation, and horizontal viewing angle.</p>
            </div>
          </div>
        </div>

        {/* Section 2: SCM Evolution */}
        <div className="about-section">
          <h2>SCM Version Evolution (Git Branches & Tags)</h2>
          <p>
            This project was developed through structured Software Configuration Management practices using Git branches and tags:
          </p>
          <div className="version-table-wrap">
            <table className="version-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Branch / Tag</th>
                  <th>Key Specification Changes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>v1.0</strong></td>
                  <td><code>master</code> / <code>v1.0</code></td>
                  <td>Baseline theatre with 11 rows (176 red seats), 2 aisles, maroon curtains, basic ambient lighting.</td>
                </tr>
                <tr>
                  <td><strong>v1.1</strong></td>
                  <td><code>version1</code> / <code>v1.1</code></td>
                  <td>Structure changes: 14 rows (224 blue seats), centre aisle gap, enlarged 22m raised stage, light grey background.</td>
                </tr>
                <tr>
                  <td><strong>v2.0</strong></td>
                  <td><code>version2</code> / <code>v2.0</code></td>
                  <td>Atmosphere & features: Gold curtains, 3 stage spotlights, dark night background, orbit controls + WASD walk-through, 70mm movie banner.</td>
                </tr>
                <tr>
                  <td><strong>v2.0 Merged</strong></td>
                  <td><code>master</code> / <code>v2.0-merged</code></td>
                  <td>Clean merge and conflict resolution combining all structure and lighting enhancements.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Navigation CTAs */}
        <div className="about-cta-bar">
          <a href="./theatre.html" className="btn-primary-about">🏛️ Open 3D Cinema Hall</a>
          <Link to="/listings" className="btn-secondary-about">🎟️ Browse All Shows & Movies</Link>
        </div>
      </div>
    </div>
  );
}
