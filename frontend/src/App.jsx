import { useEffect, useState } from 'react';
import { API_URL } from './api';
import {
  MapPin,
  Clock,
  ChevronDown,
  Compass,
  ShieldCheck,
  Lock,
  X,
  Star,
  User,
  Calendar,
  LogOut,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Leaf,
  Award,
  Sparkles
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import ActivityDetails from './ActivityDetails';

const HERO_SLIDES = [
  {
    id: 1,
    badge: 'RED SEA MARINE PARADISE',
    title: 'LAND OF EXQUISITE NATURE',
    description:
      'Discover vibrant coral reefs, crystal-clear turquoise lagoons, and eco-friendly kayaking & sunset beach BBQs in Sharm El Sheikh.',
    image: '/hero-sea.jpeg',
    ctaText: 'Explore Water Tours',
    filterTarget: 'Water Sports'
  },
  {
    id: 2,
    badge: '100% ZERO-EMISSION SAFARI',
    title: 'GOLDEN SINAI DESERT TRAILS',
    description:
      'Ride Arabian horses and camels, carve golden sand dunes, and stargaze under the Milky Way in our zero-trace Bedouin eco-camps.',
    image: '/hero-desert.jpg',
    ctaText: 'Explore Desert Safari',
    filterTarget: 'Safari & Desert'
  },
  {
    id: 3,
    badge: 'SUSTAINABLE SHARM ADVENTURES',
    title: 'ECO RIDES & WIND THRILLS',
    description:
      'Glide across Sharm’s coastal palm boulevards on Electra cruiser e-bikes or harness pure desert wind on a zero-emission Kite Trike.',
    image: '/activities/electra-bicycles.jpg',
    fallbackImage: '/hero-sea.jpeg',
    ctaText: 'View All Activities',
    filterTarget: 'All'
  }
];

export default function App() {
  const [adminMode, setAdminMode] = useState(false);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('sharm_admin_token') || '');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Hero Slider & Navbar Scroll States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // User Account States
  const [userToken, setUserToken] = useState(() => localStorage.getItem('userToken') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  const [activities, setActivities] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [filter, setFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeActivity, setActiveActivity] = useState(null);

  const fetchActivities = async () => {
    try {
      const [spotsRes, revRes] = await Promise.all([
        fetch(`${API_URL}/api/spots`),
        fetch(`${API_URL}/api/reviews`)
      ]);
      if (spotsRes.ok) {
        const spotsData = await spotsRes.json();
        setActivities(Array.isArray(spotsData) ? spotsData : []);
      }
      if (revRes.ok) {
        const revData = await revRes.json();
        setAllReviews(Array.isArray(revData) ? revData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Auto-advance Hero Slides every 6 seconds
  useEffect(() => {
    if (adminMode || activeActivity) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [adminMode, activeActivity]);

  // Detect scroll to add sleek dark frosted glass to Navbar
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  const handleUserAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setUserToken(data.token);
        setCurrentUser(data.user);
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', phone: '', password: '' });
      } else {
        setAuthError(res.status === 429 ? 'Too many attempts. Please wait 15 minutes.' : (data.error || 'Authentication failed'));
      }
    } catch {
      setAuthError('Server connection error');
    }
  };

  const handleUserLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
    setUserToken('');
    setCurrentUser(null);
    setShowMyBookings(false);
  };

  const openMyBookings = async () => {
    setShowMyBookings(true);
    try {
      const res = await fetch(`${API_URL}/api/my-bookings`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.status === 401) {
        handleUserLogout();
        return;
      }
      if (res.ok) {
        setMyBookings(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminClick = () => {
    if (adminToken) {
      setAdminMode(true);
    } else {
      setLoginError('');
      setPasswordInput('');
      setShowLoginModal(true);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        sessionStorage.setItem('sharm_admin_token', data.token);
        setAdminToken(data.token);
        setPasswordInput('');
        setShowLoginModal(false);
        setAdminMode(true);
      } else if (res.status === 429) {
        setLoginError('Too many failed attempts. Please wait 15 minutes.');
      } else {
        setLoginError(data.error || 'Incorrect admin password!');
      }
    } catch {
      setLoginError('Server connection error');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('sharm_admin_token');
    setAdminToken('');
    setAdminMode(false);
  };

  const getActivityRating = (activityId) => {
    if (!Array.isArray(allReviews)) return { avg: '5.0', count: 0 };
    const actRevs = allReviews.filter((r) => r.activityId === activityId);
    if (actRevs.length === 0) return { avg: '5.0', count: 0 };
    const avg = (actRevs.reduce((sum, r) => sum + r.rating, 0) / actRevs.length).toFixed(1);
    return { avg, count: actRevs.length };
  };

  const categories = ['All', 'Safari & Desert', 'Water Sports', 'Eco Rides'];
  const filtered = filter === 'All' ? activities : activities.filter((a) => a.category === filter);

  const activeHero = HERO_SLIDES[currentSlide];

  if (adminMode && adminToken) {
    return (
      <AdminDashboard
        onBack={() => setAdminMode(false)}
        onLogout={handleAdminLogout}
        onRefreshActivities={fetchActivities}
      />
    );
  }

  if (activeActivity) {
    return (
      <ActivityDetails
        activity={activeActivity}
        currentUser={currentUser}
        onReviewAdded={fetchActivities}
        onBack={() => {
          setActiveActivity(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Unified Dark Glass Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-neutral-950/90 backdrop-blur-xl shadow-2xl border-b border-white/10 py-3'
            : 'bg-gradient-to-b from-black/75 via-black/35 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="Sharm Go Green Logo"
              className="h-13 sm:h-14 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            />
            <div className="hidden sm:block">
              <span className="font-extrabold text-xl text-white block leading-none tracking-tight">
                SHARM GO GREEN
              </span>
              <span className="text-[11px] font-semibold text-orange-400 tracking-wider">
                ECO SAFARI & WATERSPORTS
              </span>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-6 font-bold text-sm text-white/90">
            <a href="#" className="hover:text-orange-400 transition">
              HOME
            </a>
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 hover:text-orange-400 transition py-2 cursor-pointer">
                ACTIVITIES <ChevronDown className="w-4 h-4" />
              </button>
              {dropdownOpen && activities.length > 0 && (
                <div className="absolute left-0 top-full w-64 bg-neutral-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl py-2 z-50 border border-white/15">
                  {activities.map((act) => (
                    <button
                      key={act._id}
                      onClick={() => {
                        setActiveActivity(act);
                        setDropdownOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full text-left px-5 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-emerald-400 flex justify-between items-center transition cursor-pointer"
                    >
                      <span>{act.name}</span>
                      <span className="text-orange-400 font-bold">{act.price}$</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a href="#about" className="hover:text-orange-400 transition">
              ABOUT US
            </a>
            <a href="#contact" className="hover:text-orange-400 transition">
              CONTACT US
            </a>

            {/* Social Links in Navbar */}
            <div className="flex items-center gap-3 pl-3 border-l border-white/20">
              <a
                href="https://www.instagram.com/gogreensharm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white/80 hover:text-orange-400 transition"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/gogreensharm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-white/80 hover:text-orange-400 transition"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <>
                <button
                  onClick={openMyBookings}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-3.5 py-2.5 rounded-full transition cursor-pointer"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">{currentUser.name.split(' ')[0]} •</span> My Bookings
                </button>
                <button
                  onClick={handleUserLogout}
                  title="Logout"
                  className="p-2.5 text-white/75 hover:text-red-400 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:bg-white/15 border border-white/30 backdrop-blur-sm px-4 py-2.5 rounded-full transition cursor-pointer"
              >
                <User className="w-4 h-4" /> Login / Sign Up
              </button>
            )}

            <button
              onClick={handleAdminClick}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm px-3.5 py-2.5 rounded-full transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" /> ADMIN
            </button>
            <a
              href="#activities"
              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 sm:py-3 rounded-full shadow-lg shadow-orange-500/25 transition"
            >
              BOOK NOW ↗
            </a>
          </div>
        </div>
      </nav>

      {/* Full-Screen Interactive Hero Slider */}
      <header className="relative h-screen min-h-[660px] max-h-[960px] w-full overflow-hidden bg-neutral-950 text-white flex items-center">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              onError={(e) => {
                if (slide.fallbackImage && e.currentTarget.src !== slide.fallbackImage) {
                  e.currentTarget.src = slide.fallbackImage;
                }
              }}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/50 to-neutral-950/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/30" />
          </div>
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-16">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Vertical Step Indicator */}
            <div className="hidden md:flex lg:col-span-1 flex-col items-center justify-center gap-5">
              <div className="w-px h-14 bg-white/25" />
              {HERO_SLIDES.map((slide, idx) => {
                const active = idx === currentSlide;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`transition-all duration-300 flex items-center justify-center cursor-pointer ${
                      active
                        ? 'w-9 h-9 rounded-full bg-white text-neutral-950 font-extrabold text-sm shadow-lg scale-110'
                        : 'w-3 h-3 rounded-full bg-white/40 hover:bg-white text-[0px]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
              <div className="w-px h-14 bg-white/25" />
            </div>

            {/* Center-Left Slide Text & CTA */}
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-block bg-orange-500/20 backdrop-blur-md border border-orange-400/40 text-orange-300 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase">
                {activeHero.badge}
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] uppercase drop-shadow-md">
                {activeHero.title}
              </h1>

              <p className="text-neutral-200/90 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
                {activeHero.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#activities"
                  onClick={() => setFilter(activeHero.filterTarget)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm px-7 py-3.5 rounded-full shadow-xl shadow-orange-500/25 transition transform hover:-translate-y-0.5"
                >
                  {activeHero.ctaText}
                </a>
                <a
                  href="#contact"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-bold text-sm px-6 py-3.5 rounded-full transition"
                >
                  Our Location
                </a>
              </div>
            </div>

            {/* Right Interactive Preview Cards */}
            <div className="hidden lg:flex lg:col-span-5 items-center justify-end gap-5">
              {HERO_SLIDES.map((slide, idx) => {
                if (idx === currentSlide) return null;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    className="group relative w-48 h-64 rounded-3xl overflow-hidden border border-white/20 hover:border-orange-400 shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer text-left"
                  >
                    <img
                      src={slide.image}
                      onError={(e) => {
                        if (slide.fallbackImage && e.currentTarget.src !== slide.fallbackImage) {
                          e.currentTarget.src = slide.fallbackImage;
                        }
                      }}
                      alt={slide.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-black/25 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                        0{slide.id}
                      </span>
                      <p className="text-white font-extrabold text-sm leading-snug line-clamp-2">
                        {slide.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Center Navigation Arrows */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-orange-500 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-orange-500 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition cursor-pointer shadow-lg"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Activities Grid - Unified Dark Cinematic Theme */}
      <section id="activities" className="relative py-24 px-6 overflow-hidden">
        {/* Subtle Ambient Glows matching Hero */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute bottom-10 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="inline-block bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-4 py-1 rounded-full text-xs font-extrabold tracking-widest uppercase">
              CURATED ECO EXPERIENCES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
              ACTIVITIES & <span className="text-orange-400">EQUIPMENT</span>
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-sm sm:text-base">
              Select any adventure to inspect trail highlights, customize your equipment or tent size, and reserve instantly.
            </p>

            {/* Dark Glass Category Filter Pills */}
            <div className="flex flex-wrap justify-center items-center gap-3 pt-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold tracking-wide transition cursor-pointer ${
                    filter === cat
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-14 bg-white/5 backdrop-blur-md rounded-3xl border border-dashed border-white/15 space-y-4">
              <Compass className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Loading Sharm Go Green Activities...</h3>
              <button
                onClick={handleAdminClick}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-full cursor-pointer text-sm"
              >
                Admin Login to Initialize Catalog
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((item) => {
                const ratingInfo = getActivityRating(item._id);
                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      setActiveActivity(item);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group bg-neutral-900/80 backdrop-blur-md rounded-3xl border border-white/10 hover:border-orange-500/50 shadow-xl hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer hover:-translate-y-1.5"
                  >
                    <div>
                      <div className="relative h-60 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/25" />
                        <span className="absolute top-3.5 right-3.5 bg-orange-500 text-white font-extrabold text-base px-4 py-1 rounded-full shadow-lg">
                          {item.price}$
                        </span>
                        <span className="absolute bottom-3.5 left-3.5 bg-black/60 backdrop-blur-md border border-white/15 text-emerald-300 text-xs font-bold px-3.5 py-1 rounded-full">
                          {item.category}
                        </span>
                      </div>

                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xl font-extrabold text-white group-hover:text-orange-400 transition">
                            {item.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-500/15 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {ratingInfo.avg} {ratingInfo.count > 0 && `(${ratingInfo.count})`}
                          </span>
                        </div>

                        <p className="text-neutral-400 text-sm line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="pt-2 space-y-1.5 text-xs font-medium text-neutral-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Duration: {item.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-orange-400" />
                            <span>{item.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <button className="w-full bg-white/10 group-hover:bg-orange-500 border border-white/15 group-hover:border-orange-500 text-white font-extrabold py-3.5 rounded-full transition cursor-pointer">
                        View Details & Equipment ({item.price}$) →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* About / Why Sharm Go Green - Dark Glass Feature Strip */}
      <section id="about" className="relative py-20 px-6 border-t border-white/10 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block bg-orange-500/15 border border-orange-400/30 text-orange-300 px-4 py-1 rounded-full text-xs font-extrabold tracking-widest uppercase">
              OUR ECO-PHILOSOPHY
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase">
              WHY <span className="text-emerald-400">SHARM GO GREEN?</span>
            </h2>
            <p className="text-neutral-300 leading-relaxed text-base sm:text-lg">
              We combine the thrill of Sinai desert safaris and Red Sea snorkeling with sustainable, eco-conscious equipment. Every experience respects Sharm El Sheikh’s delicate marine reefs and desert wildlife.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-7 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">100% Eco-Conscious</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Zero-emission Electra e-bikes, wind-powered Kite Trikes, and zero-trace desert camps designed to protect Sinai’s nature.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-7 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Certified Local Guides</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Experienced Bedouin desert trackers and certified Red Sea marine instructors ensuring safety and authentic hospitality.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-7 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Tailored Packages</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Customize solo, couple, or family setups with transparent pricing, instant booking confirmation, and 24/7 WhatsApp support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Dark Luxury Footer */}
      <footer id="contact" className="bg-neutral-950 border-t border-white/10 pt-16">
        <div className="max-w-7xl mx-auto px-6 pb-14 grid md:grid-cols-4 gap-10 items-center text-center md:text-left">
          <div className="space-y-2">
            <h4 className="font-extrabold text-emerald-400 text-xs tracking-widest uppercase">
              LOCATION GOOGLE MAP
            </h4>
            <a
              href="https://maps.google.com/?q=Sharm+El+Sheikh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-orange-400 font-semibold transition"
            >
              <MapPin className="w-4 h-4 text-emerald-400" /> Open in Google Maps ↗
            </a>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-emerald-400 text-xs tracking-widest uppercase">
              LOCATION YANDEX MAP
            </h4>
            <a
              href="https://yandex.com/maps/?text=Sharm+El+Sheikh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-orange-400 font-semibold transition"
            >
              <MapPin className="w-4 h-4 text-orange-400" /> Open in Yandex Maps ↗
            </a>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-emerald-400 text-xs tracking-widest uppercase">
              FOLLOW US
            </h4>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <a
                href="https://www.instagram.com/gogreensharm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 border border-white/15 text-white flex items-center justify-center shadow-md hover:scale-110 transition"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/gogreensharm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-[#1877F2] border border-white/15 text-white flex items-center justify-center shadow-md hover:scale-110 transition"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <a
              href="#activities"
              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-8 py-4 rounded-full shadow-lg shadow-orange-500/25 transition"
            >
              BOOK NOW ↗
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/60 text-neutral-400 py-4 px-6 text-xs sm:text-sm font-medium">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-2 justify-between items-center">
            <span>© 2026 <strong className="text-white">gogreensharm.com</strong> • All Rights Reserved</span>
            <span className="text-emerald-400/90">Eco-Tourism & Adventures • Sharm El Sheikh</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Contact Button */}
      <a
        href="https://wa.me/201092886872?text=Hello%20Sharm%20Go%20Green!%20I%20would%20like%20to%20inquire%20about%20an%20eco-activity."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-sm px-5 py-3.5 rounded-full shadow-xl shadow-black/40 transition-transform hover:scale-105"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
        </svg>
        <span className="hidden sm:inline">WhatsApp Us</span>
      </a>

      {/* User Login / Sign Up Modal - Dark Glass */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 text-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex gap-2 bg-white/5 p-1 rounded-full mb-6 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`flex-1 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                  authMode === 'login' ? 'bg-orange-500 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`flex-1 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                  authMode === 'register' ? 'bg-orange-500 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleUserAuth} className="space-y-3.5">
              {authMode === 'register' && (
                <>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    placeholder="Full Name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400"
                  />
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="WhatsApp / Phone Number"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400"
                  />
                </>
              )}
              <input
                type="email"
                required
                placeholder="Email Address"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Password (min. 8 characters)"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400"
              />
              {authError && <p className="text-xs font-bold text-red-400">{authError}</p>}
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 rounded-full shadow-md transition cursor-pointer"
              >
                {authMode === 'login' ? 'Login to Account' : 'Create My Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My Bookings Modal - Dark Glass */}
      {showMyBookings && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 text-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowMyBookings(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="mb-6">
              <span className="text-xs font-bold text-orange-400 uppercase">Welcome back, {currentUser.name}</span>
              <h3 className="text-2xl font-extrabold text-white">My Eco-Bookings ({myBookings.length})</h3>
            </div>
            {myBookings.length === 0 ? (
              <div className="text-center py-8 space-y-3 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-sm text-neutral-400">You haven't booked any adventures yet.</p>
                <button
                  onClick={() => setShowMyBookings(false)}
                  className="bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-full cursor-pointer"
                >
                  Browse Activities
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map((b) => (
                  <div
                    key={b._id}
                    className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-extrabold text-emerald-400">{b.activityName}</p>
                      <p className="text-xs text-neutral-300">
                        {b.selectedOption} • {b.guests} Guest(s)
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" /> {b.date}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-extrabold text-lg text-white">${b.totalPrice}</p>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {b.status === 'Confirmed' && <CheckCircle className="w-3.5 h-3.5" />}
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Password Modal - Dark Glass */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 text-white rounded-3xl max-w-sm w-full p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Admin Access</h3>
                <p className="text-xs text-neutral-400">Enter your admin password to manage bookings & tours.</p>
              </div>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter Admin Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400"
              />
              {loginError && <p className="text-xs font-bold text-red-400">{loginError}</p>}
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full transition cursor-pointer"
              >
                Unlock Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}