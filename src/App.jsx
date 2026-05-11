import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { DotmCircular8 } from './components/ui/dotm-circular-8';
import { GlassDock } from './components/ui/glass-dock';
import VantaFog from './components/ui/vanta-fog';
import Home from './pages/Home';
import About from './pages/About';
import Register from './pages/Register';
import Contact from './pages/Contact';
import './App.css';

const dockItems = [
  {
    title: 'Home',
    icon: 'ri-home-4-line',
    onClick: () => {
      document.querySelector('#home')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
  {
    title: 'About',
    icon: 'ri-information-line',
    onClick: () => {
      document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
  {
    title: 'Register',
    icon: 'ri-edit-box-line',
    onClick: () => {
      document.querySelector('#register')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
  {
    title: 'Contact',
    icon: 'ri-mail-send-line',
    onClick: () => {
      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
    },
  },
];

const MIN_LOADER_MS = 2400;

export default function App() {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'exiting' | 'ready'

  useEffect(() => {
    const start = performance.now();

    const handleLoad = () => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_LOADER_MS - elapsed);

      // Wait until minimum loader time, then add 200ms delay
      setTimeout(() => {
        setPhase('exiting');
        // After the exit animation finishes (500ms), show the site
        setTimeout(() => setPhase('ready'), 500);
      }, remaining + 200);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <>
      {/* Loading screen */}
      {phase !== 'ready' && (
        <div className={`loader-screen ${phase === 'exiting' ? 'loader-exit' : ''}`}>
          <DotmCircular8
            speed={1.2}
            animated
            size={48}
            dotSize={6}
            color="#ffffff"
          />
        </div>
      )}

      {/* Actual site */}
      <div
        className={`app-scroll-container ${phase === 'ready' ? 'site-enter' : 'site-hidden'}`}
      >
        <Navbar />
        <Home />
        
        {/* Unified wrapper for sections after hero */}
        <div className="after-hero-wrapper">
          <div className="vanta-bg-absolute-global">
             <VantaFog 
                highlightColor={0xff9d00} // Bright Gold/Orange
                midtoneColor={0xe3690f}  // Vibrant Hero Orange
                lowlightColor={0xf2f2f2}  // Light grey shadows
                baseColor={0xffffff}      // White section background
                speed={0.8}
                zoom={1.2}
              />
          </div>
          <About />
          <Register />
          <Contact />
        </div>
      </div>

      {/* Glass Dock — fixed bottom center */}
      {phase === 'ready' && (
        <div className="glass-dock-wrapper">
          <GlassDock items={dockItems} />
        </div>
      )}
    </>
  );
}
