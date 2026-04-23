import './Home.css';

export default function Home() {
  return (
    <section id="home" className="home-section">
      {/* Ambient glow orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      {/* Main hero */}
      <div className="home-main">
        <div className="club-block">
          <span className="club-name">YenFinity</span>
          <span className="presents">presents</span>
        </div>

        <h1 className="hero-title">FusionVerse 1.0</h1>

        <p className="hero-tagline">&ldquo;Think. Create. Experience.&rdquo;</p>

        <p className="hero-desc">
          A beginner-friendly innovation experience where ideas come to life.
          No coding, no pressure just think, create, and present your vision.
        </p>

        <a href="https://docs.google.com/forms/d/e/1FAIpQLSfoTU0o9tbjsLRe454d7rXJMsVLlhPRUDCmAGPCO-GIu7tMLQ/viewform?usp=publish-editor" target="__blank" className="btn-register" id="home-register-btn">
          REGISTER
        </a>
      </div>
    </section>
  );
}
