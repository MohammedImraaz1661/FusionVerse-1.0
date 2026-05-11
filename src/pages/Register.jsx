import './Register.css';

export default function Register() {
  return (
    <section id="register" className="register-section">
      <div className="register-inner">
        <div className="register-content">
          <h2 className="register-heading">Register</h2>
          <p className="register-body">
            Ready to explore the world of technology and innovation? FusionVerse 1.0 is your chance
            to learn, create, and bring your ideas to life in a beginner-friendly environment. Whether
            you're curious about tech or just love solving problems, this experience is designed for you.
            Register now and take your first step into building something exciting — no prior experience needed.
          </p>

          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfoTU0o9tbjsLRe454d7rXJMsVLlhPRUDCmAGPCO-GIu7tMLQ/viewform?usp=publish-editor"
            target='__blank'
            className="btn-reg"
            id="register-now-btn"
            aria-label="Register for FusionVerse 1.0"
          >
            REGISTER
          </a>
        </div>
      </div>
    </section>
  );
}
