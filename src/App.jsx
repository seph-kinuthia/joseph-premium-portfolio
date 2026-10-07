import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, Home, Menu, MessageCircle, Send, X } from 'lucide-react';

const ExperienceCanvas = lazy(() =>
  import('./components/ExperienceCanvas.jsx').then((module) => ({ default: module.ExperienceCanvas }))
);

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const heroRef = useRef(null);
  const interactionRef = useRef({ x: 0, y: 0, active: 0, near: 0 });
  const visualRef = useRef({ x: 0, y: 0, near: 0, scroll: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion) return undefined;

    const setTarget = (event) => {
      const rect = hero.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const x = px * 2 - 1;
      const y = py * 2 - 1;
      const portraitX = window.innerWidth < 760 ? 0.52 : 0.66;
      const portraitY = window.innerWidth < 760 ? 0.4 : 0.46;
      const distance = Math.hypot(px - portraitX, py - portraitY);
      interactionRef.current.x = Math.max(-1, Math.min(1, x));
      interactionRef.current.y = Math.max(-1, Math.min(1, y));
      interactionRef.current.active = 1;
      interactionRef.current.near = Math.max(0, 1 - distance / 0.36);
    };

    const resetTarget = () => {
      interactionRef.current.active = 0;
      interactionRef.current.near = 0;
    };

    const updateScroll = () => {
      const rect = hero.getBoundingClientRect();
      const range = window.innerHeight || 1;
      visualRef.current.scroll = Math.max(0, Math.min(1, -rect.top / range));
    };

    const tick = () => {
      const target = interactionRef.current;
      const visual = visualRef.current;
      const active = target.active;
      visual.x += ((target.x * active) - visual.x) * 0.08;
      visual.y += ((target.y * active) - visual.y) * 0.08;
      visual.near += (target.near - visual.near) * 0.08;
      hero.style.setProperty('--hero-x', visual.x.toFixed(4));
      hero.style.setProperty('--hero-y', visual.y.toFixed(4));
      hero.style.setProperty('--portrait-near', visual.near.toFixed(4));
      hero.style.setProperty('--hero-scroll', visual.scroll.toFixed(4));
      frameRef.current = requestAnimationFrame(tick);
    };

    updateScroll();
    frameRef.current = requestAnimationFrame(tick);
    hero.addEventListener('pointermove', setTarget);
    hero.addEventListener('pointerleave', resetTarget);
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);

    return () => {
      hero.removeEventListener('pointermove', setTarget);
      hero.removeEventListener('pointerleave', resetTarget);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion]);

  return (
    <>
      <Suspense fallback={<div className="experience-fallback" aria-hidden="true" />}>
        <ExperienceCanvas reducedMotion={reducedMotion} activeLab={0} interactionRef={interactionRef} />
      </Suspense>
      <div className="noise" aria-hidden="true" />

      <header className={`site-nav hero-only-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
        <a href="#hero" className="brand" aria-label="Joseph home">
          <span>J</span>
          <strong>JOSEPH</strong>
        </a>
        <nav className="desktop-links">
          <a href="#hero">
            <Home size={17} />
            Home
          </a>
          <a href="#contact">
            <MessageCircle size={17} />
            Contact
          </a>
        </nav>
        <a className="nav-cta" href="#contact">
          <Send size={17} />
          Start a project
        </a>
        <button className="menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className={`mobile-panel ${menuOpen ? 'is-open' : ''}`}>
        <a href="#hero" onClick={() => setMenuOpen(false)}>
          <Home size={17} />
          Home
        </a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>
          <MessageCircle size={17} />
          Contact
        </a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>
          <Send size={17} />
          Start a project
        </a>
      </div>

      <main className="single-hero-page">
        <section className="hero hero-focused" id="hero" ref={heroRef}>
          <div className="hero-copy" data-depth="foreground">
            <div className="availability">
              <span />
              Available for selected projects
            </div>
            <h1 className="hero-title" aria-label="I build digital experiences.">
              <span className="title-layer title-layer-back" aria-hidden="true">
                <span>I BUILD</span>
                <span>DIGITAL</span>
                <span>EXPERIENCES.</span>
              </span>
              <span className="title-layer title-layer-front" aria-hidden="true">
                <span>I BUILD</span>
                <span>DIGITAL</span>
                <span>EXPERIENCES.</span>
              </span>
            </h1>
            <p>Modern websites, SaaS platforms and interactive products.</p>
            <div className="hero-actions" id="contact">
              <a className="button primary" href="mailto:">
                Start a project <ArrowRight size={18} />
              </a>
              <a className="button secondary" href="mailto:">
                Let's work together
              </a>
            </div>
          </div>

          <aside className="hero-snapshot" aria-label="Joseph's focus" data-depth="foreground">
            <span>Frontend systems</span>
            <span>SaaS interfaces</span>
            <span>3D web experiences</span>
          </aside>
        </section>
      </main>
    </>
  );
}

export default App;
