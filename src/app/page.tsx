'use client';

import { Button } from 'antd';
import {
  SafetyOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  BankOutlined,
  HomeOutlined,
  HeartOutlined,
  LockOutlined,
  ArrowRightOutlined,
  GlobalOutlined,
  BlockOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // If logged in, redirect to bond marketplace
  useEffect(() => {
    if (user) {
      router.push('/bond-marketplace');
    }
  }, [user, router]);

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const setSectionRef = (id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };

  const isVisible = (id: string) => visibleSections.has(id);

  const features = [
    {
      icon: <BankOutlined style={{ fontSize: 32, color: '#00bf63' }} />,
      title: 'Sukuk Bond Trading',
      description: 'Invest in tokenized Shariah-compliant bonds. Buy fractional ownership and earn halal returns upon maturity.',
    },
    {
      icon: <HomeOutlined style={{ fontSize: 32, color: '#00bf63' }} />,
      title: 'Real Asset Investment',
      description: 'Own fractions of real-world assets like properties and commodities. Receive proportional payouts when assets are sold.',
    },
    {
      icon: <HeartOutlined style={{ fontSize: 32, color: '#00bf63' }} />,
      title: 'Zakat & Charity',
      description: 'Fulfill your Islamic obligations easily. Donate to verified charities directly from your wallet with full transparency.',
    },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up with your email. An XRPL wallet is automatically created and funded for you.' },
    { num: '02', title: 'Browse Marketplace', desc: 'Explore Sukuk bonds and tokenized real assets with full documentation and expected returns.' },
    { num: '03', title: 'Invest & Trade', desc: 'Buy tokens at market price or place limit orders on the decentralized order book.' },
    { num: '04', title: 'Earn Returns', desc: 'Receive XRP payouts automatically on-chain when bonds mature or assets are sold.' },
  ];

  const benefits = [
    {
      icon: <SafetyOutlined style={{ fontSize: 28 }} />,
      title: 'Shariah-Compliant',
      desc: 'No riba, no gharar. Full transparency in profit-sharing following Islamic finance principles.',
    },
    {
      icon: <LockOutlined style={{ fontSize: 28 }} />,
      title: 'Secure & Trustworthy',
      desc: 'Built on XRPL blockchain with clawback-enabled smart contracts ensuring protected investments.',
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 28 }} />,
      title: 'Fast & Low Cost',
      desc: 'Transactions settle in 3-5 seconds with fees under $0.01, making investing accessible to all.',
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 28 }} />,
      title: 'Fully Transparent',
      desc: 'Every transaction recorded on the public XRPL blockchain. Verify anytime on the explorer.',
    },
  ];

  const stats = [
    { value: '3-5s', label: 'Settlement Time' },
    { value: '<$0.01', label: 'Transaction Fee' },
    { value: '100%', label: 'On-Chain Transparency' },
  ];

  if (user) return null;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', overflow: 'hidden' }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00bf63, #00a855)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BlockOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#f5f5f5',
            letterSpacing: '-0.5px',
          }}>
            Amanah
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#features" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
            Features
          </a>
          <a href="#how-it-works" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
            How It Works
          </a>
          <a href="#why-amanah" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
            Why Amanah
          </a>
          <Button
            type="primary"
            className="green-glow-btn"
            onClick={() => router.push('/login')}
            style={{ borderRadius: 8, height: 38, fontWeight: 600 }}
          >
            Launch App
          </Button>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="landing-hero landing-section" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingTop: 80,
      }}>
        {/* Decorative orbs */}
        <div className="orb orb-green landing-float" style={{ width: 400, height: 400, top: '10%', right: '-5%' }} />
        <div className="orb orb-dark landing-float-slow" style={{ width: 300, height: 300, bottom: '10%', left: '-3%' }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div className="landing-fade-in" style={{ marginBottom: 24 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 100,
              background: 'rgba(0, 191, 99, 0.1)',
              border: '1px solid rgba(0, 191, 99, 0.2)',
              color: '#00bf63',
              fontSize: 13,
              fontWeight: 500,
            }}>
              <GlobalOutlined /> Powered by XRP Ledger
            </span>
          </div>

          <h1 className="landing-fade-in landing-fade-in-delay-1" style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            color: '#f5f5f5',
            lineHeight: 1.1,
            margin: '0 0 24px',
            letterSpacing: '-1.5px',
          }}>
            Shariah-Compliant{' '}
            <span className="shimmer-text">Investing</span>
            <br />
            on the Blockchain
          </h1>

          <p className="landing-fade-in landing-fade-in-delay-2" style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.7,
            maxWidth: 640,
            margin: '0 auto 40px',
          }}>
            Invest in tokenized Sukuk bonds and real-world assets with fractional ownership,
            transparent trading, and guaranteed on-chain redemption.
          </p>

          <div className="landing-fade-in landing-fade-in-delay-3" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              type="primary"
              size="large"
              className="green-glow-btn"
              icon={<ArrowRightOutlined />}
              onClick={() => router.push('/login')}
              style={{ height: 52, paddingInline: 36, fontSize: 16, fontWeight: 600, borderRadius: 12 }}
            >
              Get Started
            </Button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                height: 52,
                paddingInline: 36,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 12,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#f5f5f5',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            >
              Learn More
            </button>
          </div>

          {/* Stats bar */}
          <div className="landing-fade-in landing-fade-in-delay-4" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 48,
            marginTop: 72,
            flexWrap: 'wrap',
          }}>
            {stats.map((stat, i) => (
              <div key={i} className="glass-card" style={{ padding: '20px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#00bf63', marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section
        id="features"
        ref={setSectionRef('features')}
        className="landing-section"
        style={{ padding: '120px 24px', background: '#0a0a0a' }}
      >
        <div className="orb orb-green" style={{ width: 350, height: 350, top: '20%', left: '-10%' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            textAlign: 'center',
            marginBottom: 64,
            opacity: isVisible('features') ? 1 : 0,
            transform: isVisible('features') ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 100,
              background: 'rgba(0, 191, 99, 0.1)',
              color: '#00bf63',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Platform
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: '#f5f5f5', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              Everything You Need to Invest
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto' }}>
              A complete platform for ethical, transparent, and accessible investments
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card"
                style={{
                  padding: 32,
                  opacity: isVisible('features') ? 1 : 0,
                  transform: isVisible('features') ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.8s ease ${index * 0.15}s`,
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'rgba(0, 191, 99, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#f5f5f5', margin: '0 0 12px' }}>{feature.title}</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.7 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        id="how-it-works"
        ref={setSectionRef('how-it-works')}
        className="landing-section"
        style={{ padding: '120px 24px', background: '#0d0d0d' }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            textAlign: 'center',
            marginBottom: 72,
            opacity: isVisible('how-it-works') ? 1 : 0,
            transform: isVisible('how-it-works') ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 100,
              background: 'rgba(0, 191, 99, 0.1)',
              color: '#00bf63',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Getting Started
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: '#f5f5f5', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              Start Investing in 4 Steps
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '0 auto' }}>
              From sign-up to earning returns, the entire process is seamless
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
          }}>
            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  opacity: isVisible('how-it-works') ? 1 : 0,
                  transform: isVisible('how-it-works') ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.8s ease ${index * 0.12}s`,
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: index === 0
                    ? 'linear-gradient(135deg, #00bf63, #00a855)'
                    : 'rgba(255,255,255,0.05)',
                  border: index !== 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: index === 0 ? '#fff' : '#00bf63',
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}>
                  {step.num}
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 600, color: '#f5f5f5', margin: '0 0 10px' }}>{step.title}</h4>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY AMANAH ===== */}
      <section
        id="why-amanah"
        ref={setSectionRef('why-amanah')}
        className="landing-section"
        style={{ padding: '120px 24px', background: '#0a0a0a' }}
      >
        <div className="orb orb-green" style={{ width: 300, height: 300, bottom: '10%', right: '-5%' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            textAlign: 'center',
            marginBottom: 64,
            opacity: isVisible('why-amanah') ? 1 : 0,
            transform: isVisible('why-amanah') ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 100,
              background: 'rgba(0, 191, 99, 0.1)',
              color: '#00bf63',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Why Choose Us
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: '#f5f5f5', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              Built for Trust & Transparency
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto' }}>
              Designed for Muslim investors seeking ethical, transparent, and accessible investments
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="glass-card"
                style={{
                  padding: 28,
                  opacity: isVisible('why-amanah') ? 1 : 0,
                  transform: isVisible('why-amanah') ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.8s ease ${index * 0.1}s`,
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(0, 191, 99, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  color: '#00bf63',
                }}>
                  {benefit.icon}
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 600, color: '#f5f5f5', margin: '0 0 8px' }}>{benefit.title}</h4>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BUILT ON XRPL ===== */}
      <section
        id="xrpl"
        ref={setSectionRef('xrpl')}
        className="landing-section"
        style={{
          padding: '100px 24px',
          background: 'linear-gradient(180deg, #0d0d0d 0%, #0a1a0f 50%, #0d0d0d 100%)',
          textAlign: 'center',
        }}
      >
        <div style={{
          maxWidth: 700,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          opacity: isVisible('xrpl') ? 1 : 0,
          transform: isVisible('xrpl') ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease',
        }}>
          <div className="landing-pulse-glow" style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'rgba(0, 191, 99, 0.1)',
            border: '1px solid rgba(0, 191, 99, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <BlockOutlined style={{ fontSize: 32, color: '#00bf63' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: '#f5f5f5', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
            Built on XRP Ledger
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 40 }}>
            XRPL is one of the most sustainable and efficient blockchains, settling transactions
            in seconds with near-zero fees and minimal energy consumption.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            {[
              { icon: <ThunderboltOutlined />, text: '3-5 Second Settlement' },
              { icon: <CheckCircleOutlined />, text: '< $0.01 Transaction Fee' },
              { icon: <SafetyOutlined />, text: 'Carbon Neutral' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ color: '#00bf63', fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 15 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="landing-section" style={{
        padding: '100px 24px',
        background: '#0a0a0a',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: '#f5f5f5', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
            Ready to Start Investing?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 36 }}>
            Join Amanah today and access Shariah-compliant investments on the blockchain.
          </p>
          <Button
            type="primary"
            size="large"
            className="green-glow-btn"
            icon={<ArrowRightOutlined />}
            onClick={() => router.push('/login')}
            style={{ height: 52, paddingInline: 40, fontSize: 16, fontWeight: 600, borderRadius: 12 }}
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        padding: '40px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#0a0a0a',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #00bf63, #00a855)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BlockOutlined style={{ color: '#fff', fontSize: 13 }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Amanah</span>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Shariah-Compliant Tokenization Platform on XRPL
          </span>
        </div>
      </footer>
    </div>
  );
}
