import './Contact.css';

const contacts = {
  faculty: [
    { name: 'Prasanna Kumar', contact: '96637 01697' },
    { name: 'Ramya A', contact: '94810 70861' },
    { name: 'Abdul Majeed K M', contact: '98954 13378' },
    { name: 'Safmina P K', contact: '81130 62434' },
  ],
  student: [
    { name: 'Saima Sharmin', contact: '90081 87826' },
    { name: 'Vyshnav S Madhav', contact: '97787 53233' },
    { name: 'Vaibhav Rai A V', contact: '95397 55923' },
    { name: 'Shida Yasmin', contact: '81056 47247' },
  ],
  committee: [
    { name: 'Dr Rupinder Singh', position: 'HOD, AI & ML Department', contact: '99149 57257' },
  ],
};

export default function Contact() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-main">
        {/* Left column – heading + subtitle */}
        <div className="contact-left">
          <div>
            <h2 className="contact-heading">Contact Us</h2>
            <p className="contact-sub">
              Get in touch with us for any doubts
              <br />
              and questions
            </p>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <h2 className="contact-heading" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>Organizing Committee</h2>
            <div className="contacts-group" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {contacts.committee.map(({ name, position, contact }, i) => (
                  <div className="contact-card" key={`committee-${i}`}>
                    <span className="contact-name">{name}</span>
                    <span className="contact-info" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{position}</span>
                    <span className="contact-info">{contact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right area – contacts grid */}
        <div className="contact-right">
          {/* Faculty */}
          <div className="contacts-group">
            <h3 className="group-heading">Faculty Members</h3>
            <div className="contact-grid">
              {contacts.faculty.map(({ name, contact }, i) => (
                <div className="contact-card" key={`faculty-${i}`}>
                  <span className="contact-name">{name}</span>
                  <span className="contact-info">{contact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Student */}
          <div className="contacts-group">
            <h3 className="group-heading">Student Coordinators</h3>
            <div className="contact-grid">
              {contacts.student.map(({ name, contact }, i) => (
                <div className="contact-card" key={`student-${i}`}>
                  <span className="contact-name">{name}</span>
                  <span className="contact-info">{contact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="contact-image-area">
            <img src="/bottom-img.jpg" alt="Contact" className="contact-image" />
          </div>
        </div>
      </div>

      {/* Bottom social links */}
      <div className="contact-footer">
        <div className="social-links">
          <a
            href="https://www.instagram.com/yenartificia?igsh=MWtwaTl6Zmhua3Rmeg=="
            className="social-link"
            id="contact-instagram-btn"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow us on Instagram"
          >
            Instagram
          </a>
          <a
            href="https://www.linkedin.com/in/yen-artificia-179725400"
            className="social-link"
            id="contact-linkedin-btn"
            target="_blank"
            rel="noreferrer"
            aria-label="Connect on LinkedIn"
          >
            Linkedin
          </a>
        </div>
      </div>
    </section>
  );
}
