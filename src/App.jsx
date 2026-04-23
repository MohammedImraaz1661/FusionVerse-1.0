import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Register from './pages/Register';
import Contact from './pages/Contact';
import './App.css';

export default function App() {
  return (
    <div className="app-scroll-container">
      <Navbar />
      <Home />
      <About />
      <Register />
      <Contact />
    </div>
  );
}
