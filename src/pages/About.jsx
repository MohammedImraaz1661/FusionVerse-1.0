import './About.css';

export default function About() {
  return (
    <section id="about" className="about-section">
      <div className="orb orb-about-1" aria-hidden="true" />
      <div className="orb orb-about-2" aria-hidden="true" />

      <div className="about-inner">
        <div className="about-content">
          <h2 className="about-heading">About</h2>
          <p className="about-body">
            FusionVerse 1.0 is a beginner-friendly tech experience designed to introduce young minds to
            the world of innovation, creativity, and problem-solving. Hosted at Yenepoya Institute of
            Technology, this two-day event is specially crafted for 11th and 12th standard students who
            are curious about technology but don't know where to start.
            <br /><br />
            It begins with engaging awareness sessions and hands-on training that simplify concepts like
            apps, AI, and digital tools — making them easy to understand and exciting to explore. The
            experience then shifts into a fun, fast-paced competition where participants transform their
            ideas into creative solutions — no coding required, just imagination, teamwork, and the
            confidence to present.
            <br /><br />
            FusionVerse isn't just an event, it's a space to think differently, build creatively, and
            take your very first step into the world of tech.
          </p>

          <a
            href="/Poster.jpeg"
            target='__blank'
            download
            className="btn-brochure"
            id="about-brochure-btn"
            aria-label="Download brochure"
          >
            POSTER
          </a>
        </div>
      </div>
    </section>
  );
}
