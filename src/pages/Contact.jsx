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
    { name: 'Vaibhav Rai', contact: '95397 55923' },
    { name: 'Ashin Imraaz', contact: '74113 97590' },
  ],
};

export default function Contact() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-main">
        {/* Left column – heading + subtitle */}
        <div className="contact-left">
          <h2 className="contact-heading">Contact Us</h2>
          <p className="contact-sub">
            Get in touch with us for any doubts
            <br />
            and questions
          </p>
        </div>

        {/* Right area – contacts grid */}
        <div className="contact-right">
          {/* Faculty */}
          <div className="contacts-group">
            <h3 className="group-heading">Faculty</h3>
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
            <h3 className="group-heading">Student</h3>
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
