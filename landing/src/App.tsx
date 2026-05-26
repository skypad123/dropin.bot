import { useEffect, useRef, createContext, useContext, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Palette, Zap, Shield, Code, Globe,
  Twitter, Github, Linkedin,
  Sun, Moon, Link, Settings, Lock,
  Rocket, ChevronRight
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════
   THEME CONTEXT
   ═══════════════════════════════════════════ */

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: 'light', toggleTheme: () => {} });

function useTheme() {
  return useContext(ThemeContext);
}

/* ─── Theme Provider ─── */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('dropin-theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return saved ?? (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dropin-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ─── Theme Toggle Button ─── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 hover:scale-105"
      style={{
        borderColor: 'var(--border-color)',
        background: 'transparent',
        color: 'var(--text-primary)',
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

/* ═══════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════ */

/* ─── Section Label ─── */
function SectionLabel({ text }: { text: string }) {
  return <p className="section-label mb-4">{text}</p>;
}

/* ─── Navigation ─── */
function Navigation() {
  const navRef = useRef<HTMLElement>(null);
  const scrolled = useRef(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return;
      const isScrolled = window.scrollY > 60;
      if (isScrolled && !scrolled.current) {
        scrolled.current = true;
        navRef.current.style.backdropFilter = 'blur(12px)';
        navRef.current.style.borderBottom = '1px solid var(--border-color)';
        if (theme === 'dark') {
          navRef.current.style.background = 'rgba(26, 24, 20, 0.85)';
        } else {
          navRef.current.style.background = 'rgba(250, 245, 236, 0.85)';
        }
      } else if (!isScrolled && scrolled.current) {
        scrolled.current = false;
        navRef.current.style.background = 'transparent';
        navRef.current.style.backdropFilter = 'none';
        navRef.current.style.borderBottom = '1px solid transparent';
      } else if (isScrolled && scrolled.current) {
        // Update background when theme changes while scrolled
        if (theme === 'dark') {
          navRef.current.style.background = 'rgba(26, 24, 20, 0.85)';
        } else {
          navRef.current.style.background = 'rgba(250, 245, 236, 0.85)';
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [theme]);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
      style={{ borderBottom: '1px solid transparent' }}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 flex items-center justify-between h-[72px]">
        <a href="#" className="flex items-center gap-3">
          <img src="/assets/logo-icon.png" alt="dropin.bot" className="w-10 h-10 rounded-[20%]" />
          <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            dropin<span style={{ fontWeight: 400 }}>.bot</span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {['Product', 'How it Works', 'Features', 'Brand'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="font-body text-sm font-medium transition-opacity duration-200 hover:opacity-70"
              style={{ color: 'var(--text-primary)', letterSpacing: '0.01em' }}
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <a
            href="#cta"
            className="inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold transition-all duration-250 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #C05640 0%, #F39075 100%)',
              color: '#FAF5EC',
            }}
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   SECTIONS
   ═══════════════════════════════════════════ */

/* ─── Hero Section ─── */
function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const mascotRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headlineRef.current, {
        y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.3,
      });
      gsap.from(subRef.current, {
        y: 40, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.6,
      });
      gsap.from(mascotRef.current, {
        scale: 0.85, opacity: 0, duration: 1.2, ease: 'elastic.out(1, 0.6)', delay: 0.6,
      });
      gsap.to(mascotRef.current, {
        y: -12, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8,
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="product" className="relative min-h-screen overflow-hidden hero-radial" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 pt-[140px] pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-center min-h-[70vh]">
          {/* Text */}
          <div>
            <SectionLabel text="No terminal required" />
            <h1
              ref={headlineRef}
              className="font-display font-bold leading-[1.05]"
              style={{ fontSize: 'clamp(42px, 5.5vw, 76px)', color: 'var(--text-primary)' }}
            >
              Your AI assistant, deployed in seconds
            </h1>
            <p
              ref={subRef}
              className="font-body text-lg leading-relaxed mt-6 max-w-[500px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              dropin.bot spins up your personal OpenClaw system with one click. Private, powerful, and yours — no engineering degree needed.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <a
                href="#cta"
                className="inline-flex items-center px-8 py-3.5 rounded-full text-[15px] font-semibold transition-all duration-250 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #C05640 0%, #F39075 100%)',
                  color: '#FAF5EC',
                  boxShadow: '0 4px 16px rgba(192, 86, 64, 0.25)',
                }}
              >
                Spin up your assistant
                <ChevronRight size={16} className="ml-1" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center px-8 py-3.5 rounded-full text-[15px] font-semibold border-[1.5px] transition-all duration-250 hover:-translate-y-0.5"
                style={{ borderColor: 'var(--burnt-orange)', color: 'var(--burnt-orange)' }}
              >
                See how it works
              </a>
            </div>
          </div>
          {/* Mascot */}
          <div className="relative flex justify-center lg:justify-end">
            <img ref={mascotRef} src="/assets/mascot-hero.png" alt="dropin.bot Wallaby" className="max-w-[300px] lg:max-w-[400px] w-full" />
            {/* Chat bubbles */}
            <div className="absolute top-[10%] right-[5%] float-bubble-1" style={{
              background: 'var(--bg-surface)', border: '2px solid var(--border-color)',
              borderRadius: '24px 24px 24px 4px', padding: '10px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>
              <span className="font-body text-[13px]" style={{ color: 'var(--text-primary)' }}>Summarize my meeting notes</span>
            </div>
            <div className="absolute top-[40%] left-0 float-bubble-2" style={{
              background: 'var(--bg-surface)', border: '2px solid var(--border-color)',
              borderRadius: '24px 24px 4px 24px', padding: '10px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>
              <span className="font-body text-[13px]" style={{ color: 'var(--text-primary)' }}>Help me write this email</span>
            </div>
            <div className="absolute bottom-[15%] right-[10%] float-bubble-3" style={{
              background: 'var(--bg-surface)', border: '2px solid var(--border-color)',
              borderRadius: '24px 24px 24px 4px', padding: '10px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>
              <span className="font-body text-[13px]" style={{ color: 'var(--text-primary)' }}>What's on my calendar today?</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works Section ─── */
function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const steps = [
    { icon: Link, title: 'Connect your OpenClaw', desc: 'Link your OpenClaw account or API key. We handle the infrastructure setup automatically — servers, networking, SSL.' },
    { icon: Settings, title: 'Configure your assistant', desc: 'Choose your model, set your personality, connect your data sources. Make it truly yours without writing a single config file.' },
    { icon: Rocket, title: 'Go live instantly', desc: 'Hit deploy. Your personal assistant is live on your own infrastructure in under 60 seconds. Just like that.' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.step-card', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-[120px]" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-16">
        <div className="text-center max-w-[600px] mx-auto">
          <SectionLabel text="How it works" />
          <h2 className="font-display font-bold text-[clamp(36px,4vw,56px)] leading-tight" style={{ color: 'var(--text-primary)' }}>
            From zero to assistant in three hops
          </h2>
          <p className="font-body text-lg mt-4" style={{ color: 'var(--text-secondary)' }}>
            No Docker. No config files. No terminal. We built dropin.bot so anyone can deploy their own AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="step-card rounded-3xl p-8"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
            >
              <span className="font-mono text-xs font-medium" style={{ color: 'var(--burnt-orange)', letterSpacing: '0.08em' }}>0{i + 1}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mt-4" style={{ background: 'rgba(192, 86, 64, 0.1)' }}>
                <Icon size={24} style={{ color: 'var(--burnt-orange)' }} />
              </div>
              <h4 className="font-display font-medium text-xl mt-5" style={{ color: 'var(--text-primary)' }}>{title}</h4>
              <p className="font-body text-[15px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <img src="/assets/mascot-sitting.png" alt="" className="w-[130px] opacity-80" />
        </div>
      </div>
    </section>
  );
}

/* ─── Features Section ─── */
function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const features = [
    { icon: Lock, title: 'Private by default', desc: 'Your assistant runs on your own OpenClaw infrastructure. Your data never leaves your control. You own everything.' },
    { icon: Palette, title: 'Match your style', desc: 'Customize personality, knowledge base, and conversation style. Your assistant, your way — not some generic chatbot.' },
    { icon: Zap, title: 'One-click deploy', desc: 'No Docker, no config files, no terminal. One button and your assistant is live. We mean it when we say anyone can do it.' },
    { icon: Shield, title: 'Secure & isolated', desc: 'End-to-end encryption, isolated environments, and zero data retention. Built for peace of mind, not surveillance.' },
    { icon: Code, title: 'Developer-friendly', desc: 'Want more control? Full API access, custom functions, and webhook support for when you need to go off-road.' },
    { icon: Globe, title: 'Access from anywhere', desc: 'Chat via web, mobile, or integrate into Slack, Discord, and your favorite tools. Your assistant follows you everywhere.' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="py-[120px] relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <img src="/assets/mascot-watermark.png" alt="" className="absolute bottom-0 right-0 w-[400px] md:w-[600px] pointer-events-none select-none" style={{ opacity: 0.04, transform: 'translate(20%, 20%)' }} />

      <div className="max-w-[1200px] mx-auto px-6 md:px-16 relative z-10">
        <SectionLabel text="Features" />
        <h2 className="font-display font-bold text-[clamp(36px,4vw,56px)] leading-tight" style={{ color: 'var(--text-primary)' }}>
          Everything you need, nothing you don't
        </h2>
        <p className="font-body text-lg mt-4 max-w-[560px]" style={{ color: 'var(--text-secondary)' }}>
          We stripped away the complexity so you can focus on what matters — having an AI that actually helps you get things done.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="feature-card rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 cursor-default"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--burnt-orange)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192, 86, 64, 0.1)' }}>
                <Icon size={24} style={{ color: 'var(--burnt-orange)' }} />
              </div>
              <h4 className="font-display font-medium text-xl mt-5" style={{ color: 'var(--text-primary)' }}>{title}</h4>
              <p className="font-body text-[15px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials Section ─── */
function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    { quote: "I had my own AI assistant running in under a minute. I still can't believe I didn't need to touch a terminal.", name: 'Morgan Lee', role: 'Freelance Designer' },
    { quote: "dropin.bot let me deploy OpenClaw for my whole team without hiring a DevOps engineer. Absolute game changer.", name: 'Carlos Rivera', role: 'Founder, Studio Nine' },
    { quote: "Finally, a way to run my own AI that's actually private. Set it up during my coffee break and it was ready to go.", name: 'Priya Sharma', role: 'Product Manager' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.testimonial-card', {
        y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.12,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-[120px]" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-16">
        <div className="text-center max-w-[600px] mx-auto">
          <SectionLabel text="Loved by early adopters" />
          <h2 className="font-display font-bold text-[clamp(36px,4vw,56px)] leading-tight" style={{ color: 'var(--text-primary)' }}>
            Don't take our word for it
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {testimonials.map(({ quote, name, role }) => (
            <div
              key={name}
              className="testimonial-card rounded-3xl p-8"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
            >
              <p className="font-body text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>"{quote}"</p>
              <div className="flex items-center gap-3 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm" style={{ background: 'var(--burnt-orange)', color: '#FAF5EC' }}>
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="font-body text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Brand Identity Showcase ─── */
function BrandShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.showcase-item', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.12,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="brand" className="py-[120px]" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-16">
        <SectionLabel text="The Brand" />
        <h2 className="font-display font-bold text-[clamp(36px,4vw,56px)] leading-tight" style={{ color: 'var(--text-primary)' }}>
          Built with personality
        </h2>
        <p className="font-body text-lg mt-4 max-w-[560px]" style={{ color: 'var(--text-secondary)' }}>
          Our wallaby mascot represents what we stand for — agile, friendly, and approachable. dropin.bot makes powerful AI feel warm and welcoming.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="showcase-item rounded-3xl p-10 flex flex-col items-center justify-center min-h-[240px]" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <span className="font-mono text-xs uppercase mb-6" style={{ color: 'var(--burnt-orange)', letterSpacing: '0.08em' }}>Primary Lockup</span>
            <img src="/assets/logo-lockup.png" alt="Primary Logo" className="max-w-[200px]" />
          </div>
          <div className="showcase-item rounded-3xl p-10 flex flex-col items-center justify-center min-h-[240px]" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <span className="font-mono text-xs uppercase mb-6" style={{ color: 'var(--burnt-orange)', letterSpacing: '0.08em' }}>App Icon</span>
            <img src="/assets/logo-icon.png" alt="Logo Icon" className="w-20 h-20 rounded-[20%]" />
          </div>
          <div className="showcase-item rounded-3xl p-10 flex flex-col items-center justify-center min-h-[240px]" style={{ backgroundColor: 'var(--deep-charcoal)' }}>
            <span className="font-mono text-xs uppercase mb-6" style={{ color: 'var(--warm-coral)', letterSpacing: '0.08em' }}>On Dark</span>
            <div className="flex items-center gap-3">
              <img src="/assets/logo-icon.png" alt="Logo Icon" className="w-12 h-12 rounded-[20%]" />
              <span className="font-display font-bold text-xl" style={{ color: '#FAF5EC' }}>
                dropin<span style={{ fontWeight: 400 }}>.bot</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mascot poses */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {[
            { img: '/assets/mascot-hero.png', title: 'Hero Pose' },
            { img: '/assets/mascot-sitting.png', title: 'Sitting Pose' },
            { img: '/assets/mascot-cta.png', title: 'CTA Pose' },
            { img: '/assets/mascot-watermark.png', title: 'Watermark' },
          ].map((pose) => (
            <div key={pose.title} className="showcase-item rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <div className="h-[160px] flex items-center justify-center p-4">
                <img src={pose.img} alt={pose.title} className="max-h-full object-contain" />
              </div>
              <div className="px-5 pb-4">
                <p className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{pose.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Dark Mode Colors Showcase ─── */
function DarkModeColorsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const lightColors = [
    { name: 'Burnt Orange', hex: '#C05640', token: 'Primary', desc: 'Brand signature' },
    { name: 'Soft Cream', hex: '#FAF5EC', token: 'Background', desc: 'Light surfaces' },
    { name: 'Deep Charcoal', hex: '#2D2A26', token: 'Text', desc: 'Primary text' },
    { name: 'Warm Coral', hex: '#F39075', token: 'Accent', desc: 'Highlights' },
  ];

  const darkColors = [
    { name: 'Dark BG', hex: '#1A1814', token: 'Dark Background', desc: 'Primary dark surface' },
    { name: 'Dark Surface', hex: '#24211C', token: 'Cards', desc: 'Elevated dark surface' },
    { name: 'Text Primary', hex: '#F0EBE0', token: 'Text', desc: 'Warm off-white text' },
    { name: 'Border Dark', hex: '#3D3830', token: 'Borders', desc: 'Dark mode dividers' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.color-item', {
        y: 30, opacity: 0, scale: 0.9, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.06,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-[120px]" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-16">
        <SectionLabel text="Color System" />
        <h2 className="font-display font-bold text-[clamp(36px,4vw,56px)] leading-tight" style={{ color: 'var(--text-primary)' }}>
          Light & dark, warm all around
        </h2>
        <p className="font-body text-lg mt-4 max-w-[560px]" style={{ color: 'var(--text-secondary)' }}>
          Our palette stays warm and energetic in both modes. The burnt orange signature works everywhere — no compromises.
        </p>

        {/* Light mode swatches */}
        <h4 className="font-display font-medium text-base mt-12 mb-4" style={{ color: 'var(--text-primary)' }}>Light Mode</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lightColors.map((c) => (
            <div key={c.hex} className="color-item rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div className="h-20 w-full" style={{ backgroundColor: c.hex }} />
              <div className="p-4">
                <p className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--burnt-orange)' }}>{c.hex}</p>
                <p className="font-body text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dark mode swatches */}
        <h4 className="font-display font-medium text-base mt-10 mb-4" style={{ color: 'var(--text-primary)' }}>Dark Mode</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {darkColors.map((c) => (
            <div key={c.hex} className="color-item rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div className="h-20 w-full" style={{ backgroundColor: c.hex }} />
              <div className="p-4">
                <p className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--burnt-orange)' }}>{c.hex}</p>
                <p className="font-body text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live preview toggle */}
        <div className="color-item rounded-2xl p-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div>
            <h4 className="font-display font-medium text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
              Currently in {theme} mode
            </h4>
            <p className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
              Toggle the theme switcher in the nav to see the entire page adapt.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ─── */
function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(mascotRef.current, {
        scale: 0.5, opacity: 0, duration: 1, ease: 'elastic.out(1, 0.5)',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      });
      gsap.from('.cta-element', {
        y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="cta" className="py-[120px] relative overflow-hidden dot-pattern" style={{ backgroundColor: '#2D2A26' }}>
      <div className="max-w-[800px] mx-auto px-6 md:px-16 text-center relative z-10">
        <img ref={mascotRef} src="/assets/mascot-cta.png" alt="" className="w-[100px] mx-auto mb-8" />
        <h2 className="cta-element font-display font-bold text-[clamp(36px,4vw,56px)] leading-tight" style={{ color: '#F0EBE0' }}>
          Ready to drop in?
        </h2>
        <p className="cta-element font-body text-lg mt-4" style={{ color: '#A89E90' }}>
          Your personal AI assistant is one click away. No credit card required to start.
        </p>
        <div className="cta-element mt-10">
          <button
            className="inline-flex items-center px-10 py-4 rounded-full text-[15px] font-semibold transition-all duration-250 hover:-translate-y-0.5"
            style={{ background: '#FAF5EC', color: '#C05640', boxShadow: '0 4px 16px rgba(250, 245, 236, 0.15)' }}
            onClick={() => alert('Welcome to dropin.bot! Your assistant will be ready in seconds.')}
          >
            Spin up your assistant
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
        <p className="cta-element font-mono text-xs mt-6 uppercase" style={{ color: 'rgba(168, 158, 144, 0.6)', letterSpacing: '0.06em' }}>
          Free tier includes 100 conversations/month
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--deep-charcoal)', color: '#F0EBE0' }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <img src="/assets/logo-icon.png" alt="" className="w-12 h-12 rounded-[20%]" />
              <span className="font-display font-bold text-xl" style={{ color: '#F0EBE0' }}>
                dropin<span style={{ fontWeight: 400 }}>.bot</span>
              </span>
            </div>
            <p className="font-body text-sm mt-4" style={{ color: '#A89E90' }}>
              The cleanest way to deploy your personal OpenClaw AI assistant. No terminal required.
            </p>
          </div>
          {[
            { header: 'Product', links: ['Deploy', 'Docs', 'Pricing', 'API'] },
            { header: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { header: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
          ].map((col) => (
            <div key={col.header}>
              <h5 className="font-mono text-xs font-medium uppercase mb-4" style={{ color: '#F39075', letterSpacing: '0.08em' }}>{col.header}</h5>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="font-body text-sm transition-all duration-200 hover:text-[#F0EBE0]" style={{ color: '#A89E90' }}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between mt-16 pt-6 gap-4" style={{ borderTop: '1px solid rgba(240, 235, 224, 0.08)' }}>
          <p className="font-body text-sm" style={{ color: 'rgba(168, 158, 144, 0.5)' }}>© 2024 dropin.bot. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="transition-opacity duration-200 hover:opacity-100" style={{ color: '#F0EBE0', opacity: 0.5 }}>
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */
export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navigation />
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TestimonialsSection />
        <BrandShowcase />
        <DarkModeColorsSection />
        <CTASection />
        <Footer />
      </div>
    </ThemeProvider>
  );
}
