import { API_URL } from '../api'; // في ActivityDetails.jsx و AdminDashboard.jsx
import { API_URL } from './api';  // في App.jsx


import { useEffect, useState } from 'react';
import { Leaf, MapPin, Clock, ChevronDown, Compass, ShieldCheck, Lock, X, RefreshCw, Star, User, Calendar, LogOut, CheckCircle } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import ActivityDetails from './ActivityDetails';

export default function App() {
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState(() => sessionStorage.getItem('adminPass') || '');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // User Account States
  const [userToken, setUserToken] = useState(() => localStorage.getItem('userToken') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
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
        fetch('http://localhost:5000/api/spots'),
        fetch('http://localhost:5000/api/reviews')
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

  const handleUserAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
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
        setAuthError(data.error || 'Authentication failed');
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
      const res = await fetch('http://localhost:5000/api/my-bookings', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        setMyBookings(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeed = async () => {
    await fetch('http://localhost:5000/api/seed', { method: 'POST' });
    fetchActivities();
  };

  const handleAdminClick = () => {
    if (adminPassword) {
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
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        sessionStorage.setItem('adminPass', passwordInput);
        setAdminPassword(passwordInput);
        setShowLoginModal(false);
        setAdminMode(true);
      } else {
        setLoginError('Incorrect admin password!');
      }
    } catch {
      setLoginError('Server connection error');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminPass');
    setAdminPassword('');
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

  if (adminMode && adminPassword) {
    return (
      <AdminDashboard
        adminPassword={adminPassword}
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
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2.5 shrink-0">
            <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center text-white shadow-md">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-green-700 block leading-none">SHARM GO GREEN</span>
              <span className="text-[11px] font-semibold text-orange-500 tracking-wider">ECO SAFARI & WATERSPORTS</span>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-7 font-bold text-sm text-green-700">
            <a href="#" className="hover:text-orange-500 transition">HOME</a>
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 hover:text-orange-500 transition py-2 cursor-pointer">
                ACTIVITIES <ChevronDown className="w-4 h-4" />
              </button>
              {dropdownOpen && activities.length > 0 && (
                <div className="absolute left-0 top-full w-64 bg-neutral-900 text-white rounded-xl shadow-2xl py-2 z-50">
                  {activities.map((act) => (
                    <button
                      key={act._id}
                      onClick={() => {
                        setActiveActivity(act);
                        setDropdownOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full text-left px-5 py-2.5 text-sm font-medium hover:bg-neutral-800 hover:text-green-400 flex justify-between items-center transition cursor-pointer"
                    >
                      <span>{act.name}</span>
                      <span className="text-orange-400 font-bold">{act.price}$</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a href="#about" className="hover:text-orange-500 transition">ABOUT US</a>
            <a href="#contact" className="hover:text-orange-500 transition">CONTACT US</a>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <>
                <button
                  onClick={openMyBookings}
                  className="flex items-center gap-1.5 text-xs font-bold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-3.5 py-2.5 rounded-full transition cursor-pointer"
                >
                  <User className="w-4 h-4 text-green-700" />
                  <span className="hidden sm:inline">{currentUser.name.split(' ')[0]} •</span> My Bookings
                </button>
                <button
                  onClick={handleUserLogout}
                  title="Logout"
                  className="p-2.5 text-slate-500 hover:text-red-600 bg-slate-100 rounded-full transition cursor-pointer"
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
                className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:bg-green-50 border border-green-600 px-4 py-2.5 rounded-full transition cursor-pointer"
              >
                <User className="w-4 h-4" /> Login / Sign Up
              </button>
            )}

            <button
              onClick={handleAdminClick}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-green-700 bg-slate-100 px-3.5 py-2.5 rounded-full transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-green-700" /> ADMIN
            </button>
            <a
              href="#activities"
              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 sm:py-3 rounded-full shadow-md transition"
            >
              BOOK NOW ↗
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-r from-green-900 via-green-800 to-emerald-900 text-white py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block bg-orange-500/20 border border-orange-400/40 text-orange-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">
              100% Eco-Friendly Adventures in Sharm El Sheikh
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Unforgettable Desert & Red Sea <span className="text-orange-400">Adventures</span>
            </h1>
            <p className="text-green-100 text-lg leading-relaxed">
              Book zero-emission Electra Bicycles, Kite Trike safaris, Red Sea Kayaking, Sandboarding, and Sunset Beach BBQs directly with Sharm’s premier eco-activity hub.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#activities" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-full shadow-lg transition">
                Explore Activities
              </a>
              <a href="#contact" className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-full transition">
                Our Location
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80"
              alt="Kayaking"
              className="rounded-3xl h-56 w-full object-cover shadow-xl border-4 border-white/15"
            />
            <img
              src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80"
              alt="Horses"
              className="rounded-3xl h-56 w-full object-cover shadow-xl border-4 border-white/15 mt-6"
            />
          </div>
        </div>
      </header>

      {/* Activities Grid */}
      <section id="activities" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold text-green-700 tracking-tight">ACTIVITIES & EQUIPMENT</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Click on any activity card to view full details, choose your equipment or tent size, and reserve online.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer ${
                  filter === cat ? 'bg-green-700 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-green-50'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={handleSeed}
              title="Refresh / Load all 9 activities"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync All 9 Tours
            </button>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-green-200 space-y-4">
            <Compass className="w-12 h-12 text-green-600 mx-auto" />
            <h3 className="text-xl font-bold">Load Your 9 Sharm Go Green Activities</h3>
            <button
              onClick={handleSeed}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-full cursor-pointer"
            >
              + Load All 9 Activities & Prices
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
                  className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition overflow-hidden flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-3 right-3 bg-orange-500 text-white font-extrabold text-base px-4 py-1 rounded-full shadow">
                        {item.price}$
                      </span>
                      <span className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <div className="p-6 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-green-700 transition">
                          {item.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200/70 px-2.5 py-1 rounded-full shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {ratingInfo.avg} {ratingInfo.count > 0 && `(${ratingInfo.count})`}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{item.description}</p>
                      <div className="pt-2 space-y-1 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-green-600" /> Duration: {item.duration}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" /> {item.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button className="w-full bg-green-700 group-hover:bg-orange-500 text-white font-bold py-3 rounded-full transition cursor-pointer">
                      View Details & Equipment ({item.price}$) →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="bg-green-50 py-16 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-extrabold text-green-800">WHY SHARM GO GREEN?</h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            We combine the thrill of Sinai desert safaris and Red Sea snorkeling with sustainable, eco-conscious equipment. Whether you are riding our Electra bicycles, kayaking through Nabq’s mangroves, or enjoying a sunset Beach BBQ, every experience respects Sharm El Sheikh’s natural beauty.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white border-t border-slate-200 pt-14">
        <div className="max-w-7xl mx-auto px-6 pb-12 grid md:grid-cols-3 gap-10 items-center text-center md:text-left">
          <div className="space-y-2">
            <h4 className="font-extrabold text-green-700 text-sm tracking-wider">LOCATION GOOGLE MAP</h4>
            <a
              href="https://maps.google.com/?q=Sharm+El+Sheikh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-orange-500 font-semibold"
            >
              <MapPin className="w-4 h-4 text-green-600" /> Open in Google Maps ↗
            </a>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-green-700 text-sm tracking-wider">LOCATION YANDEX MAP</h4>
            <a
              href="https://yandex.com/maps/?text=Sharm+El+Sheikh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-orange-500 font-semibold"
            >
              <MapPin className="w-4 h-4 text-orange-500" /> Open in Yandex Maps ↗
            </a>
          </div>

          <div className="flex justify-center md:justify-end">
            <a
              href="#activities"
              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-8 py-4 rounded-full shadow-lg transition"
            >
              BOOK NOW ↗
            </a>
          </div>
        </div>

        <div className="bg-orange-500 text-white py-3.5 px-6 text-sm font-semibold">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span>© 2026 gogreensharm.com</span>
            <span>Eco-Tourism & Adventures • Sharm El Sheikh</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Contact Button */}
      <a
        href="https://wa.me/201000000000?text=Hello%20Sharm%20Go%20Green!%20I%20would%20like%20to%20inquire%20about%20an%20eco-activity."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-sm px-5 py-3.5 rounded-full shadow-xl transition-transform hover:scale-105"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
        </svg>
        <span className="hidden sm:inline">WhatsApp Us</span>
      </a>

      {/* User Login / Sign Up Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-full mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                  authMode === 'login' ? 'bg-green-700 text-white shadow' : 'text-slate-600'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                  authMode === 'register' ? 'bg-green-700 text-white shadow' : 'text-slate-600'
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
                    placeholder="Full Name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp / Phone Number"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </>
              )}
              <input
                type="email"
                required
                placeholder="Email Address"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
              {authError && <p className="text-xs font-bold text-red-600">{authError}</p>}
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

      {/* My Bookings Modal */}
      {showMyBookings && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowMyBookings(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="mb-6">
              <span className="text-xs font-bold text-orange-500 uppercase">Welcome back, {currentUser.name}</span>
              <h3 className="text-2xl font-extrabold text-green-800">My Eco-Bookings ({myBookings.length})</h3>
            </div>
            {myBookings.length === 0 ? (
              <div className="text-center py-8 space-y-3 bg-slate-50 rounded-2xl">
                <p className="text-sm text-slate-500">You haven't booked any adventures yet.</p>
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
                  <div key={b._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-extrabold text-green-800">{b.activityName}</p>
                      <p className="text-xs text-slate-600">{b.selectedOption} • {b.guests} Guest(s)</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-green-600" /> {b.date}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-extrabold text-lg text-slate-800">${b.totalPrice}</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
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

      {/* Admin Password Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Admin Access</h3>
                <p className="text-xs text-slate-500">Enter your admin password to manage bookings & tours.</p>
              </div>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter Admin Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-600"
              />
              {loginError && <p className="text-xs font-bold text-red-600">{loginError}</p>}
              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-full transition cursor-pointer"
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