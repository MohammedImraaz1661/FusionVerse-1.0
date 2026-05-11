import './Navbar.css';

export default function Navbar() {
  const handleClick = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navbar navbar--fixed" aria-label="Primary navigation">
      {/* Logo — left on desktop, centered on mobile via CSS */}
      <a href="#home" onClick={(e) => handleClick(e, '#home')} className="navbar-logo-wrapper">
        <img
          className="navbar-logo"
          src="/Logo for yenfinity.png"
          alt="YenFinity logo"
        />
      </a>
    </nav>
  );
}
