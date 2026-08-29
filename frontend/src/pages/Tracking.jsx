import React, { useState } from 'react';
import { Search, Package, MapPin, Truck } from 'lucide-react';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

export default function Tracking() {
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!bookingId) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}`);
      if (!res.ok) {
        throw new Error('Booking not found');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up">
      <div className="mb-8 text-center">
        <h1 style={fontDisplay} className="text-4xl font-bold mb-4 text-slate-800 tracking-tight">Track Your Lorry</h1>
        <p style={fontBody} className="text-slate-500 text-lg">Enter your booking ID to see real-time updates on your shipment.</p>
      </div>

      <div className="premium-card p-8 sm:p-12 mb-12">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-4 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="e.g. BK202600001"
              value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={!bookingId || loading}
            style={fontDisplay}
            className={`px-8 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
              (!bookingId || loading) ? 'bg-slate-100 text-slate-400' : 'btn-primary'
            }`}
          >
            {loading ? "Tracking..." : "Track Now"}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-6 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100 flex items-center gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold">!</div>
            <div>
              <p className="font-bold mb-1">Tracking Failed</p>
              <p>{error}. Please check the ID and try again.</p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-10 pt-10 border-t border-slate-100 animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <h3 style={fontDisplay} className="text-2xl font-bold text-slate-800">Status: {result.booking_status}</h3>
              <div className={`text-xs uppercase font-bold tracking-widest px-3 py-1.5 border rounded-full flex items-center gap-2 ${
                result.booking_status === 'Accepted' ? 'border-green-200 bg-green-50 text-green-600' : 
                result.booking_status === 'Rejected' ? 'border-red-200 bg-red-50 text-red-600' :
                'border-amber-200 bg-amber-50 text-amber-600'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  result.booking_status === 'Accepted' ? 'bg-green-500' : 
                  result.booking_status === 'Rejected' ? 'bg-red-500' :
                  'bg-amber-500'
                }`}></span>
                {result.booking_status}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50">
                <div className="p-3 bg-white rounded-lg shadow-sm text-blue-500"><MapPin size={24} /></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Pickup Location</p>
                  <p style={fontBody} className="text-lg font-bold text-slate-800">{result.pickup}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50">
                <div className="p-3 bg-white rounded-lg shadow-sm text-amber-500"><MapPin size={24} /></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Delivery Location</p>
                  <p style={fontBody} className="text-lg font-bold text-slate-800">{result.delivery}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50">
                <div className="p-3 bg-white rounded-lg shadow-sm text-slate-600"><Package size={24} /></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Load Type</p>
                  <p style={fontBody} className="text-lg font-bold text-slate-800">{result.load_type}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50">
                <div className="p-3 bg-white rounded-lg shadow-sm text-slate-600"><Truck size={24} /></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Driver Assigned</p>
                  <p style={fontBody} className="text-lg font-bold text-slate-800">{result.assigned_driver || 'Pending Assignment'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50">
                <div className="p-3 bg-white rounded-lg shadow-sm text-slate-600"><Package size={24} /></div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Expected Date</p>
                  <p style={fontBody} className="text-lg font-bold text-slate-800">{result.expected_date || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
