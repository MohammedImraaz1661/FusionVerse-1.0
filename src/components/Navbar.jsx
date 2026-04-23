import { useState, useEffect } from 'react';
import './Navbar.css';

const links = [
  { href: '#home',     label: 'Home'     },
  { href: '#about',    label: 'About'    },
  { href: '#register', label: 'Register' },
  { href: '#contact',  label: 'Contact'  },
];

export default function Navbar() {
  const [active, setActive] = useState('#home');

  useEffect(() => {
    const sections = links.map(l => document.querySelector(l.href)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive('#' + entry.target.id);
          }
        });
      },
      { threshold: 0.35 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleClick = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navbar navbar--fixed" aria-label="Primary navigation">
      {/* Logo — left */}
      <img
        className="navbar-logo"
        src="/Logo for yenfinity.png"
        alt="YenFinity logo"
      />

      {/* Nav links — center */}
      <div className="navbar-links">
        {links.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            onClick={(e) => handleClick(e, href)}
            className={'nav-link' + (active === href ? ' nav-link--active' : '')}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Dept label — right */}
      <p className="navbar-dept">Dept of AI &amp; ML</p>
    </nav>
  );
}
