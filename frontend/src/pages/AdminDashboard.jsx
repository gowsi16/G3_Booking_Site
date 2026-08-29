import React, { useEffect, useState } from 'react';
import { Package, MapPin, Truck, ExternalLink, RefreshCw, LogOut, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const navigate = useNavigate();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (bookingId) => {
    if (!selectedDriver) return;
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver: selectedDriver })
      });
      if (res.ok) {
        setAssigningId(null);
        setSelectedDriver("");
        fetchBookings(); // refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm("Are you sure you want to reject this order?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/reject`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchBookings(); // refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
  }, []);

  return (
    <div className="w-full animate-slide-up pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={fontDisplay} className="text-3xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
          <p style={fontBody} className="text-slate-500 mt-1">Manage and view all incoming transport bookings.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchBookings} 
            className="p-3 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline text-sm font-semibold">Refresh</span>
          </button>
          <button 
            onClick={() => navigate('/admin')} 
            className="p-3 bg-slate-900 border border-slate-900 rounded-lg text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-sm font-semibold">Logout</span>
          </button>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-semibold animate-pulse">Loading orders...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="font-semibold text-lg">No bookings found</p>
            <p className="text-sm mt-1">Orders placed will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200" style={fontBody}>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Booking ID</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Route & Date</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Load Details</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Status & Driver</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 font-mono text-sm">{b.booking_id}</div>
                      <div className="text-xs text-slate-400 mt-1">Cus: {b.customer_id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <MapPin size={14} className="text-blue-500" /> {b.pickup}
                      </div>
                      <div className="text-slate-400 text-xs ml-[3px] my-1 border-l-2 border-dashed border-slate-200 h-2"></div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                        <MapPin size={14} className="text-amber-500" /> {b.delivery}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Exp: {b.expected_date || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                        <Package size={14} className="text-slate-400" /> {b.load_type}
                      </div>
                      <div className="text-xs text-slate-500">{b.average_weight} • {b.helpers} Helper(s)</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="mb-2">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${
                          b.booking_status === 'Accepted' ? 'bg-green-100 text-green-700 border-green-200' : 
                          b.booking_status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                          'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {b.booking_status}
                        </span>
                      </div>
                      {b.assigned_driver && (
                        <div className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
                          <Truck size={12}/> {b.assigned_driver}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {assigningId === b.booking_id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <select 
                            className="text-sm border border-slate-200 rounded-lg p-2 outline-none bg-slate-50"
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                          >
                            <option value="">Select Driver</option>
                            {drivers.map(d => (
                              <option key={d.vehicle_no} value={`${d.driver} (${d.vehicle_type})`}>
                                {d.driver} - {d.vehicle_type}
                              </option>
                            ))}
                          </select>
                          <button 
                            onClick={() => handleAssign(b.booking_id)}
                            disabled={!selectedDriver}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
                          >
                            <Check size={16}/>
                          </button>
                          <button 
                            onClick={() => { setAssigningId(null); setSelectedDriver(""); }}
                            className="text-xs text-slate-500 hover:text-slate-700 underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="font-bold text-slate-800">₹{b.estimated_price.toLocaleString()}</div>
                          {b.booking_status === 'Pending' && (
                            <div className="flex flex-col items-end gap-2 mt-2">
                              <button 
                                onClick={() => setAssigningId(b.booking_id)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                              >
                                Accept & Assign
                              </button>
                              <button 
                                onClick={() => handleReject(b.booking_id)}
                                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
