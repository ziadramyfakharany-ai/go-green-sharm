import { API_URL } from '../api'; // في ActivityDetails.jsx و AdminDashboard.jsx
import { API_URL } from './api';  // في App.jsx
import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Plus, Trash2, ArrowLeft, DollarSign, Users, Calendar, LogOut, Backpack, Sparkles, MessageSquare, Star } from 'lucide-react';

export default function AdminDashboard({ adminPassword, onBack, onLogout, onRefreshActivities }) {
  const [bookings, setBookings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newAct, setNewAct] = useState({
    name: '',
    category: 'Safari & Desert',
    price: 30,
    duration: '2 Hours',
    location: 'Sharm El Sheikh',
    description: '',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-admin-password': adminPassword
  };

  const loadData = async () => {
    const [bRes, aRes, rRes] = await Promise.all([
      fetch('http://localhost:5000/api/bookings', { headers: authHeaders }),
      fetch('http://localhost:5000/api/spots'),
      fetch('http://localhost:5000/api/reviews')
    ]);
    if (bRes.ok) setBookings(await bRes.json());
    if (aRes.ok) setActivities(await aRes.json());
    if (rRes.ok) setReviews(await rRes.json());
  };

  useEffect(() => {
    loadData();
  }, []);

  const confirmBooking = async (id) => {
    await fetch(`http://localhost:5000/api/bookings/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Confirmed' })
    });
    loadData();
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/spots', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newAct)
    });
    setNewAct({ ...newAct, name: '', description: '' });
    loadData();
    onRefreshActivities();
  };

  const handleDeleteActivity = async (id) => {
    await fetch(`http://localhost:5000/api/spots/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    loadData();
    onRefreshActivities();
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    const res = await fetch(`http://localhost:5000/api/reviews/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (res.ok) {
      loadData();
      onRefreshActivities();
    }
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Sharm Go Green Control Panel</span>
            <h1 className="text-3xl font-extrabold text-green-800">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-full text-sm transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Website
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-full text-sm transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Lock
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 font-semibold">Total Bookings</p>
            <p className="text-4xl font-extrabold text-slate-800 mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 font-semibold">Estimated Revenue</p>
            <p className="text-4xl font-extrabold text-green-700 mt-1">${totalRevenue}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 font-semibold">Active Tours</p>
            <p className="text-4xl font-extrabold text-orange-500 mt-1">{activities.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 font-semibold">Customer Reviews</p>
            <p className="text-4xl font-extrabold text-amber-500 mt-1">{reviews.length}</p>
          </div>
        </div>

        {/* Customer Bookings Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-extrabold text-slate-800">Customer Reservations</h2>
          {bookings.length === 0 ? (
            <p className="text-slate-500 text-sm">No bookings received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Activity & Setup</th>
                    <th className="py-3 px-4">Selected Equipment</th>
                    <th className="py-3 px-4">Date & Guests</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm align-top">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">{b.customerName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{b.contactInfo}</p>
                        {b.notes && (
                          <p className="mt-1.5 inline-flex items-start gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {b.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-extrabold text-green-700">{b.activityName}</p>
                        {b.selectedOption && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-800 px-2.5 py-1 rounded-full">
                            <Sparkles className="w-3 h-3 text-orange-500" /> {b.selectedOption}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {b.selectedEquipment && b.selectedEquipment.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {b.selectedEquipment.map((eq, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200/70 px-2.5 py-1 rounded-lg w-fit"
                              >
                                <Backpack className="w-3 h-3 text-orange-500 shrink-0" /> {eq}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Standard gear only</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-green-600" /> {b.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs mt-1">
                          <Users className="w-3.5 h-3.5 text-orange-500" /> {b.guests} {b.guests === 1 ? 'Guest' : 'Guests'}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-800 text-base">${b.totalPrice}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {b.status === 'Confirmed' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {b.status !== 'Confirmed' && (
                          <button
                            onClick={() => confirmBooking(b._id)}
                            className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-full cursor-pointer"
                          >
                            Confirm
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add New Activity & Manage Existing */}
        <div className="grid lg:grid-cols-2 gap-8">
          <form onSubmit={handleAddActivity} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-4">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" /> Add New Activity
            </h2>
            <input
              type="text"
              required
              placeholder="Activity Name (e.g., Sunset Yacht Snorkeling)"
              value={newAct.name}
              onChange={(e) => setNewAct({ ...newAct, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newAct.category}
                onChange={(e) => setNewAct({ ...newAct, category: e.target.value })}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              >
                <option>Safari & Desert</option>
                <option>Water Sports</option>
                <option>Eco Rides</option>
              </select>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  required
                  placeholder="Price ($)"
                  value={newAct.price}
                  onChange={(e) => setNewAct({ ...newAct, price: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Duration (e.g., 3 Hours)"
                value={newAct.duration}
                onChange={(e) => setNewAct({ ...newAct, duration: e.target.value })}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
              <input
                type="text"
                placeholder="Location"
                value={newAct.location}
                onChange={(e) => setNewAct({ ...newAct, location: e.target.value })}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Image URL"
              value={newAct.image}
              onChange={(e) => setNewAct({ ...newAct, image: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
            <textarea
              required
              rows="2"
              placeholder="Short description..."
              value={newAct.description}
              onChange={(e) => setNewAct({ ...newAct, description: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full transition cursor-pointer"
            >
              Publish Activity
            </button>
          </form>

          {/* Manage Activities List */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-4">
            <h2 className="text-xl font-extrabold text-slate-800">Manage Current Activities</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activities.map((act) => (
                <div key={act._id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800">{act.name}</p>
                    <p className="text-xs text-slate-500">{act.category} • <span className="font-bold text-green-700">${act.price}</span></p>
                  </div>
                  <button
                    onClick={() => handleDeleteActivity(act._id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition cursor-pointer"
                    title="Delete Activity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Manage Customer Reviews */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-slate-800">Manage Customer Reviews ({reviews.length})</h2>
          </div>
          {reviews.length === 0 ? (
            <p className="text-slate-500 text-sm">No reviews submitted yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800">{rev.reviewerName || rev.name || 'Guest'}</span>
                      {rev.country && <span className="text-xs text-slate-500">({rev.country})</span>}
                      <span className="inline-flex items-center gap-0.5 text-xs font-extrabold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {rev.rating}
                      </span>
                    </div>
                    {rev.activityName && (
                      <p className="text-xs font-bold text-green-700">{rev.activityName}</p>
                    )}
                    <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(rev._id)}
                    className="text-red-500 hover:bg-red-100 p-2 rounded-full transition shrink-0 cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}