import { API_URL } from '../api'; // في ActivityDetails.jsx و AdminDashboard.jsx
import { API_URL } from './api';  // في App.jsx

import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, MapPin, CheckCircle2, Calendar, Users, Sparkles, Backpack, Star, Globe, Send } from 'lucide-react';

export default function ActivityDetails({ activity, onBack, onReviewAdded, currentUser }) {
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [selectedEquip, setSelectedEquip] = useState([]);
  const [form, setForm] = useState({
    customerName: currentUser?.name || '',
    contactInfo: currentUser?.phone || currentUser?.email || '',
    date: '',
    guests: 1,
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    reviewerName: currentUser?.name || '',
    country: '',
    rating: 5,
    comment: ''
  });
  const [reviewSent, setReviewSent] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || currentUser.name || '',
        contactInfo: prev.contactInfo || currentUser.phone || currentUser.email || ''
      }));
      setReviewForm((prev) => ({
        ...prev,
        reviewerName: prev.reviewerName || currentUser.name || ''
      }));
    }
  }, [currentUser]);

  const loadReviews = async () => {
    if (!activity?._id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/reviews?activityId=${activity._id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activity?._id]);

  if (!activity) return null;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: activity._id,
        activityName: activity.name,
        ...reviewForm
      })
    });
    if (res.ok) {
      setReviewForm({ reviewerName: currentUser?.name || '', country: '', rating: 5, comment: '' });
      setReviewSent(true);
      loadReviews();
      if (onReviewAdded) onReviewAdded();
      setTimeout(() => setReviewSent(false), 4000);
    }
  };

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const avgRating = safeReviews.length
    ? (safeReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / safeReviews.length).toFixed(1)
    : '5.0';

  const packages = Array.isArray(activity.packages) && activity.packages.length > 0
    ? activity.packages
    : [{ label: 'Standard Experience', extraPrice: 0 }];

  const equipmentList = Array.isArray(activity.equipmentOptions) ? activity.equipmentOptions : [];

  const toggleEquipment = (item) => {
    setSelectedEquip((prev) =>
      prev.some((e) => e.name === item.name)
        ? prev.filter((e) => e.name !== item.name)
        : [...prev, item]
    );
  };

  const currentPkg = packages[selectedPkgIndex] || packages[0];
  const equipTotal = selectedEquip.reduce((sum, e) => sum + (e.price || 0), 0);
  const totalPrice = (activity.price + (currentPkg?.extraPrice || 0)) * form.guests + equipTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser?.id || null,
        activityName: activity.name,
        customerName: form.customerName,
        contactInfo: form.contactInfo,
        date: form.date,
        guests: form.guests,
        selectedOption: currentPkg.label,
        selectedEquipment: selectedEquip.map((e) => `${e.name} (+$${e.price})`),
        notes: form.notes,
        totalPrice
      })
    });
    if (res.ok) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-green-700 hover:text-orange-500 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Activities
          </button>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-extrabold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {avgRating} ({safeReviews.length} reviews)
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider bg-green-100 text-green-800 px-3.5 py-1 rounded-full">
              {activity.category}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden shadow-lg">
          <img src={activity.image} alt={activity.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6 md:p-10">
            <div className="text-white space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                <span className="bg-orange-500 px-3.5 py-1 rounded-full text-sm">From {activity.price}$ / person</span>
                <span className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> {activity.duration}
                </span>
                <span className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5" /> {activity.location}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold">{activity.name}</h1>
            </div>
          </div>
        </div>

        {/* Details & Customizer Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-2xl font-extrabold text-green-800">About This Experience</h2>
              <p className="text-slate-600 leading-relaxed text-base">{activity.description}</p>

              {Array.isArray(activity.highlights) && activity.highlights.length > 0 && (
                <div className="pt-3 grid sm:grid-cols-2 gap-3">
                  {activity.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-green-50/70 p-3 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 1: Choose Package */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" /> 1. Choose Your Setup / Capacity
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {packages.map((pkg, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedPkgIndex(idx)}
                    className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer ${
                      selectedPkgIndex === idx
                        ? 'border-green-600 bg-green-50'
                        : 'border-slate-200 hover:border-green-300'
                    }`}
                  >
                    <p className="font-bold text-slate-800 text-sm">{pkg.label}</p>
                    <p className="text-xs font-extrabold text-orange-500 mt-1">
                      {pkg.extraPrice === 0 ? 'Included in base price' : `+$${pkg.extraPrice} per person`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Choose Equipment & Gear */}
            {equipmentList.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <Backpack className="w-5 h-5 text-green-700" /> 2. Select Equipment & Gear
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {equipmentList.map((eq, idx) => {
                    const checked = selectedEquip.some((e) => e.name === eq.name);
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleEquipment(eq)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                          checked ? 'border-orange-500 bg-orange-50/60' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="w-4 h-4 accent-green-700"
                          />
                          <span className="text-sm font-bold text-slate-700">{eq.name}</span>
                        </div>
                        <span className="text-xs font-extrabold text-green-700">
                          {eq.price === 0 ? 'FREE' : `+$${eq.price}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Traveler Reviews & Ratings */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800">Traveler Reviews & Ratings</h3>
                  <p className="text-xs text-slate-500">Verified feedback from Sharm Go Green guests</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  <div>
                    <span className="text-xl font-extrabold text-slate-800">{avgRating}</span>
                    <span className="text-xs text-slate-500"> / 5 ({safeReviews.length})</span>
                  </div>
                </div>
              </div>

              {/* Write a Review Form */}
              <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-2xl space-y-3 border border-slate-200/70">
                <p className="text-sm font-extrabold text-green-800">Share Your Experience</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={reviewForm.reviewerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                    className="border border-slate-200 bg-white rounded-xl px-3.5 py-2 text-sm"
                  />
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Country (e.g., UK, Italy)"
                      value={reviewForm.country}
                      onChange={(e) => setReviewForm({ ...reviewForm, country: e.target.value })}
                      className="w-full border border-slate-200 bg-white rounded-xl pl-9 pr-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-bold text-slate-500">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 transition ${
                              star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  required
                  rows="2"
                  placeholder="Tell other travelers about the guides, equipment, and adventure..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2 text-sm"
                />

                <div className="flex items-center justify-between">
                  {reviewSent ? (
                    <span className="text-xs font-bold text-green-700">✅ Thank you! Your review is live.</span>
                  ) : (
                    <span className="text-xs text-slate-400">Your review helps fellow eco-travelers.</span>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-5 py-2.5 rounded-full transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Post Review
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              {safeReviews.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No reviews yet for {activity.name}. Be the first to share your adventure!
                </p>
              ) : (
                <div className="space-y-4">
                  {safeReviews.map((rev) => (
                    <div key={rev._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-sm">{rev.reviewerName}</span>
                          {rev.country && (
                            <span className="ml-2 text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                              {rev.country}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Instant Reservation Form */}
          <div className="bg-white p-6 md:p-7 rounded-3xl shadow-md border border-slate-100 h-fit sticky top-24">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
                <h3 className="text-2xl font-extrabold text-slate-800">Reservation Sent!</h3>
                <p className="text-sm text-slate-600">
                  We received your booking for <span className="font-bold text-green-700">{activity.name}</span> ({currentPkg.label}). Our Sharm El Sheikh team will confirm on WhatsApp shortly.
                </p>
                <button
                  onClick={onBack}
                  className="w-full bg-green-700 text-white font-bold py-3 rounded-full cursor-pointer"
                >
                  Explore More Activities
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-orange-500 uppercase">Customize & Book</span>
                  <h3 className="text-xl font-extrabold text-slate-800">Reserve {activity.name}</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number or Email</label>
                  <input
                    type="text"
                    required
                    placeholder="+20 100 000 0000"
                    value={form.contactInfo}
                    onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-green-600" /> Date
                    </label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-green-600" /> Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={form.guests}
                      onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Pickup / Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Hotel name, room number..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-2xl space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Selected:</span>
                    <span className="font-bold text-slate-800">{currentPkg.label}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Extra Gear:</span>
                    <span className="font-bold text-slate-800">{selectedEquip.length} item(s)</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-green-200">
                    <span className="font-bold text-slate-800 text-sm">Total Price:</span>
                    <span className="text-2xl font-extrabold text-green-700">${totalPrice}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-full shadow-lg transition cursor-pointer"
                >
                  BOOK THIS ACTIVITY ↗
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}