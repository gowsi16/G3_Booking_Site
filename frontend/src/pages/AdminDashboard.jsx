import React, { useEffect, useState } from 'react';
import { 
  Package, MapPin, Truck, RefreshCw, LogOut, Check, X, 
  Search, Filter, Calendar, Users, DollarSign, Settings, 
  AlertCircle, CheckCircle2, ChevronRight, Clock, ShieldCheck, 
  History, ArrowRight, Eye, Phone, Mail, FileText, Scale
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'vehicles' | 'drivers' | 'pricing' | 'audit'

  // Data States
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  // Modals / Action States
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [assignModalBooking, setAssignModalBooking] = useState(null);
  const [assignForm, setAssignForm] = useState({
    vehicle_no: "TN 77AY 3006",
    driver: "Senthil",
    approved_fare: "",
    trip_duration_days: 1
  });
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("Lorry unavailable on requested date");

  // Driver Add State
  const [newDriverName, setNewDriverName] = useState("");

  // Admin session & User
  const [adminUser, setAdminUser] = useState(null);

  // Pricing Form State
  const [editPricing, setEditPricing] = useState(null);

  // Authenticated fetch wrapper
  const authFetch = async (url, options = {}) => {
    const token = sessionStorage.getItem('g3_admin_token');
    if (!token) {
      sessionStorage.removeItem('g3_admin_token');
      sessionStorage.removeItem('g3_admin_user');
      navigate('/admin', { replace: true });
      throw new Error("Admin authorization required. Please log in.");
    }

    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('g3_admin_token');
      sessionStorage.removeItem('g3_admin_user');
      navigate('/admin', { replace: true });
      throw new Error("Admin session expired. Please log in again.");
    }
    return res;
  };

  // Check authentication on component mount
  useEffect(() => {
    const token = sessionStorage.getItem('g3_admin_token');
    if (!token) {
      navigate('/admin', { replace: true });
      return;
    }
    try {
      const savedUser = sessionStorage.getItem('g3_admin_user');
      if (savedUser) setAdminUser(JSON.parse(savedUser));
    } catch (e) {
      console.error("Failed to parse admin user", e);
    }
  }, [navigate]);

  // Handle Admin Logout
  const handleLogout = () => {
    sessionStorage.removeItem('g3_admin_token');
    sessionStorage.removeItem('g3_admin_user');
    navigate('/admin', { replace: true });
  };

  // Fetch all core data
  const loadDashboardData = async () => {
    const token = sessionStorage.getItem('g3_admin_token');
    if (!token) return;

    setLoading(true);
    setActionError("");
    try {
      const [ovRes, bkRes, vhRes, drRes, prRes, audRes] = await Promise.all([
        authFetch('http://localhost:5000/api/admin/overview'),
        authFetch(`http://localhost:5000/api/admin/bookings?status=${encodeURIComponent(statusFilter)}&vehicle=${encodeURIComponent(vehicleFilter)}&search=${encodeURIComponent(searchQuery)}&date=${encodeURIComponent(dateFilter)}`),
        authFetch('http://localhost:5000/api/admin/vehicles'),
        authFetch('http://localhost:5000/api/admin/drivers'),
        authFetch('http://localhost:5000/api/admin/pricing'),
        authFetch('http://localhost:5000/api/admin/audit-logs')
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (bkRes.ok) setBookings(await bkRes.json());
      if (vhRes.ok) setVehicles(await vhRes.json());
      if (drRes.ok) setDrivers(await drRes.json());
      if (prRes.ok) {
        const prData = await prRes.json();
        setPricingConfig(prData.pricing);
        setEditPricing(prData.pricing);
      }
      if (audRes.ok) setAuditLogs(await audRes.json());
    } catch (err) {
      console.error(err);
      setActionError("Error loading dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [statusFilter, vehicleFilter, dateFilter]);

  // Execute Search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDashboardData();
  };

  // Open Assign Modal
  const openAssignModal = (b) => {
    setAssignModalBooking(b);
    setActionError("");
    setActionSuccess("");
    // Default vehicle to appropriate lorry matching payload if possible
    const weight = Number(b.weight_kg) || 0;
    const defaultVehicle = weight > 3500 ? "TN 77AY 3006" : "TN28 BF 1256";
    const defaultDriver = defaultVehicle === "TN 77AY 3006" ? "Senthil" : "Chithiraj";

    setAssignForm({
      vehicle_no: defaultVehicle,
      driver: defaultDriver,
      approved_fare: b.approved_fare || b.estimated_price,
      trip_duration_days: b.trip_duration_days || 1
    });
  };

  // Submit Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalBooking) return;
    setActionError("");

    try {
      const res = await authFetch(`http://localhost:5000/api/bookings/${assignModalBooking.booking_id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign vehicle");
      }

      setActionSuccess(data.message);
      setAssignModalBooking(null);
      loadDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Submit Rejection
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalBooking) return;
    setActionError("");

    try {
      const res = await authFetch(`http://localhost:5000/api/bookings/${rejectModalBooking.booking_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Cancelled',
          cancellation_reason: rejectReason
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      setActionSuccess(`Booking ${rejectModalBooking.booking_id} marked as cancelled.`);
      setRejectModalBooking(null);
      loadDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Update Status directly (In Transit, Completed)
  const handleQuickStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setActionSuccess(`Booking ${bookingId} updated to ${newStatus}.`);
        loadDashboardData();
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Add Driver
  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!newDriverName.trim()) return;

    try {
      const res = await authFetch('http://localhost:5000/api/admin/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDriverName.trim() })
      });
      if (res.ok) {
        setNewDriverName("");
        loadDashboardData();
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Toggle Driver Status
  const handleToggleDriverStatus = async (driverName, currentStatus) => {
    const next = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await authFetch(`http://localhost:5000/api/admin/drivers/${encodeURIComponent(driverName)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Vehicle Status
  const handleToggleVehicleStatus = async (vehicleNo, currentStatus) => {
    const next = currentStatus === 'Available' ? 'Maintenance' : 'Available';
    try {
      await authFetch(`http://localhost:5000/api/admin/vehicles/${encodeURIComponent(vehicleNo)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Pricing Settings
  const handleSavePricing = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    try {
      const res = await authFetch('http://localhost:5000/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPricing)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update pricing");

      setActionSuccess("Pricing rules updated and applied to all new bookings!");
      setPricingConfig(data.pricing);
      loadDashboardData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="w-full animate-slide-up pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <ShieldCheck size={12} /> Authorized Dispatch Portal {adminUser?.email ? `• ${adminUser.email}` : ''}
            </span>
          </div>
          <h1 style={fontDisplay} className="text-3xl font-bold text-slate-800 tracking-tight">
            G3 Transport Admin Operations
          </h1>
          <p style={fontBody} className="text-slate-500 text-sm mt-0.5">
            Manage customer consignments, vehicle schedules, driver assignments, and transport pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadDashboardData} 
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-amber-600 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="text-xs font-bold">Refresh</span>
          </button>
          <button 
            onClick={handleLogout} 
            className="px-4 py-3 bg-slate-900 border border-slate-900 rounded-xl text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {actionError && (
        <div className="mb-6 p-4 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200 flex items-center justify-between shadow-xs animate-slide-up">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")} className="text-red-400 hover:text-red-700 p-1"><X size={16}/></button>
        </div>
      )}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl text-sm bg-green-50 text-green-800 border border-green-200 flex items-center justify-between shadow-xs animate-slide-up">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-green-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-green-500 hover:text-green-800 p-1"><X size={16}/></button>
        </div>
      )}

      {/* Overview Stat Cards (Requirement 8) */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { label: "Total Bookings", val: overview.totalBookings, color: "text-slate-800", bg: "bg-white", border: "border-slate-200" },
            { label: "Pending Review", val: overview.pendingBookings, color: "text-amber-600", bg: "bg-amber-50/50", border: "border-amber-200" },
            { label: "Confirmed", val: overview.confirmedBookings, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-200" },
            { label: "Active Trips", val: overview.activeTrips, color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-200" },
            { label: "Completed", val: overview.completedBookings, color: "text-green-600", bg: "bg-green-50/50", border: "border-green-200" },
            { label: "Cancelled", val: overview.cancelledBookings, color: "text-red-600", bg: "bg-red-50/50", border: "border-red-200" },
            { 
              label: "Billed Revenue", 
              val: `₹${(overview.totalRevenue || 0).toLocaleString('en-IN')}`, 
              color: "text-emerald-700", 
              bg: "bg-emerald-50/50", 
              border: "border-emerald-200",
              colSpan: "col-span-2 lg:col-span-1"
            }
          ].map((c, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${c.border} ${c.bg} shadow-2xs ${c.colSpan || ''}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {c.label}
              </span>
              <span style={fontDisplay} className={`text-2xl font-extrabold ${c.color}`}>
                {c.val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl mb-8 overflow-x-auto shadow-inner gap-1">
        {[
          { id: 'orders', label: 'Order Management', icon: Package, count: bookings.length },
          { id: 'vehicles', label: 'Fleet Lorries (2)', icon: Truck, count: vehicles.length },
          { id: 'drivers', label: 'Company Drivers', icon: Users, count: drivers.length },
          { id: 'pricing', label: 'Pricing Configuration', icon: DollarSign },
          { id: 'audit', label: 'Audit Trail', icon: History, count: auditLogs.length }
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setActionError(""); setActionSuccess(""); }}
              style={fontDisplay}
              className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isSelected 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon size={16} className={isSelected ? 'text-amber-500' : 'text-slate-400'} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? 'bg-amber-100 text-amber-900' : 'bg-slate-300 text-slate-700'}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORDER MANAGEMENT                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-slide-up">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by ID, customer name, mobile, or route..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Vehicle filter */}
              <select
                value={vehicleFilter}
                onChange={e => setVehicleFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              >
                <option value="All">All Vehicles</option>
                <option value="TN 77AY 3006">TN 77AY 3006 (8 Ton)</option>
                <option value="TN28 BF 1256">TN28 BF 1256 (3.5 Ton)</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter("")} 
                  className="text-xs text-slate-400 hover:text-slate-700 underline"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Bookings Table */}
          <div className="premium-card overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-500 font-semibold animate-pulse flex flex-col items-center justify-center gap-3">
                <RefreshCw size={28} className="animate-spin text-amber-500" />
                <span>Loading transport consignment records...</span>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <Package size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-lg text-slate-700">No consignment bookings found</p>
                <p className="text-xs text-slate-400 mt-1">Adjust your search or filter settings to see more results.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200" style={fontBody}>
                      <th className="py-3.5 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Booking ID & Date</th>
                      <th className="py-3.5 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Customer Details</th>
                      <th className="py-3.5 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Route & Distance</th>
                      <th className="py-3.5 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Payload & Helpers</th>
                      <th className="py-3.5 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Lorry & Driver</th>
                      <th className="py-3.5 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider">Status & Fare</th>
                      <th className="py-3.5 px-6 text-xs uppercase font-bold text-slate-500 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {bookings.map((b) => (
                      <tr key={b.id || b.booking_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-slate-900 block text-sm">{b.booking_id}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">Exp: {b.expected_date}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Created: {b.created_at ? b.created_at.split(' ')[0] : ''}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block">{b.customer_name || 'Customer'}</span>
                          <span className="text-slate-500 font-mono block mt-0.5 flex items-center gap-1">
                            <Phone size={10} className="text-slate-400"/> {b.customer_phone || b.customer_id}
                          </span>
                          {b.customer_email && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{b.customer_email}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <MapPin size={12} className="text-blue-500"/> {b.pickup}
                          </div>
                          <div className="text-slate-400 text-xs ml-1 my-0.5 border-l-2 border-dashed border-slate-300 h-2"></div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <MapPin size={12} className="text-amber-500"/> {b.delivery}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 mt-1 block">{b.distance}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block">{b.load_type}</span>
                          <span className="text-slate-600 block mt-0.5">
                            Weight: <strong>{b.weight_kg ? `${b.weight_kg.toLocaleString('en-IN')} kg` : b.average_weight}</strong>
                          </span>
                          <span className="text-slate-500 text-[11px] block">
                            Helpers: {b.helpers || 0} (₹{ (Number(b.helper_charge) || (Number(b.helpers) || 0) * 800).toLocaleString('en-IN') })
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {b.assigned_vehicle ? (
                            <div>
                              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block w-fit mb-1">
                                {b.assigned_vehicle}
                              </span>
                              <span className="text-slate-600 block font-medium flex items-center gap-1">
                                <Truck size={11}/> Driver: {b.assigned_driver || 'Unassigned'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not Assigned</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="mb-1.5">
                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border inline-block ${
                              b.booking_status === 'Confirmed' || b.booking_status === 'Accepted' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                              b.booking_status === 'In Transit' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                              b.booking_status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                              b.booking_status === 'Cancelled' || b.booking_status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                              'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                              {b.booking_status}
                            </span>
                          </div>
                          <span style={fontDisplay} className="font-extrabold text-slate-900 text-sm block">
                            ₹{(b.approved_fare || b.estimated_price || 0).toLocaleString('en-IN')}
                          </span>
                          {b.approved_fare && b.approved_fare !== b.estimated_price && (
                            <span className="text-[10px] text-slate-400 line-through">Est: ₹{b.estimated_price}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-y-1.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBookingForDetails(b)}
                              title="View full booking & address details"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Assign button */}
                            {b.booking_status !== 'Cancelled' && b.booking_status !== 'Completed' && (
                              <button
                                onClick={() => openAssignModal(b)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs"
                              >
                                {b.assigned_vehicle ? 'Reassign' : 'Assign'}
                              </button>
                            )}
                          </div>

                          {/* Quick lifecycle transitions */}
                          {b.booking_status === 'Confirmed' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(b.booking_id, 'In Transit')}
                              className="text-[10px] font-bold text-purple-600 hover:underline block ml-auto"
                            >
                              Start Trip →
                            </button>
                          )}
                          {b.booking_status === 'In Transit' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(b.booking_id, 'Completed')}
                              className="text-[10px] font-bold text-green-600 hover:underline block ml-auto"
                            >
                              Mark Completed ✓
                            </button>
                          )}
                          {(b.booking_status === 'Pending' || b.booking_status === 'Pending Review & Assignment') && (
                            <button
                              onClick={() => setRejectModalBooking(b)}
                              className="text-[10px] font-bold text-red-500 hover:underline block ml-auto"
                            >
                              Cancel Request
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FLEET LORRIES MANAGEMENT (Requirement 8)                           */}
      {/* ========================================================================= */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <Truck className="text-amber-600 mt-0.5 shrink-0" size={20} />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Official Fleet Registry:</strong> G3 Transport owns and operates two verified commercial lorries. 
              The system automatically validates payload against each vehicle's maximum capacity limit and rejects overlapping assignments on the same date.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {vehicles.map((v) => (
              <div key={v.vehicle_no} className="premium-card p-6 border-2 border-slate-200 hover:border-amber-400 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Vehicle Registration</span>
                    <h3 style={fontDisplay} className="text-2xl font-extrabold text-slate-900">{v.vehicle_no}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    v.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {v.status}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl mb-5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model / Type:</span>
                    <span className="font-bold text-slate-800">{v.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Safe Payload Capacity:</span>
                    <span className="font-bold text-slate-800">{v.capacity_kg ? `${v.capacity_kg.toLocaleString('en-IN')} kg (${v.capacity_kg / 1000} Tons)` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Default Company Driver:</span>
                    <span className="font-bold text-slate-800">{v.driver || 'Senthil'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Operational Status:</span>
                  <button
                    onClick={() => handleToggleVehicleStatus(v.vehicle_no, v.status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      v.status === 'Available' 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {v.status === 'Available' ? 'Set to Maintenance' : 'Set to Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DRIVERS MANAGEMENT                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'drivers' && (
        <div className="space-y-6 animate-slide-up">
          {/* Add Driver Card */}
          <div className="premium-card p-6 shadow-sm">
            <h3 style={fontDisplay} className="text-lg font-bold text-slate-800 mb-3">Register Company Driver</h3>
            <form onSubmit={handleAddDriver} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Driver Full Name (e.g. Senthil, Chithiraj, Prabhu)"
                value={newDriverName}
                onChange={e => setNewDriverName(e.target.value)}
                className="flex-1 px-4 py-3 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
              <button
                type="submit"
                disabled={!newDriverName.trim()}
                className="btn-primary px-6 py-3 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                + Add Driver
              </button>
            </form>
          </div>

          {/* Drivers List */}
          <div className="premium-card overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200" style={fontBody}>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider">Driver Name</th>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider">Assigned Vehicle</th>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map(d => (
                  <tr key={d.name} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-800 text-sm">{d.name}</td>
                    <td className="py-4 px-6 text-slate-600">
                      {d.name === 'Senthil' ? 'TN 77AY 3006 (Heavy 8-Ton)' : 
                       d.name === 'Chithiraj' ? 'TN28 BF 1256 (Medium 3.5-Ton)' : 'Flexible Fleet Operator'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        d.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {d.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleDriverStatus(d.name, d.status || 'Active')}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        {d.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRICING CONFIGURATION                                              */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && editPricing && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3">
            <DollarSign className="text-blue-600 mt-0.5 shrink-0" size={20} />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong>Source of Truth for Transport Fares:</strong> Rate updates are immediately written to the database and audit logs. 
              The backend recalculates all customer bookings using these validated parameters.
            </div>
          </div>

          <form onSubmit={handleSavePricing} className="premium-card p-6 sm:p-8 space-y-6">
            <h3 style={fontDisplay} className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3">
              Base & Distance Transport Rules
            </h3>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Trip Base Fare (₹)
                </label>
                <input
                  type="number"
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white font-mono font-bold"
                  value={editPricing.baseFare}
                  onChange={e => setEditPricing({ ...editPricing, baseFare: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Base Covered Distance (km)
                </label>
                <input
                  type="number"
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white font-mono font-bold"
                  value={editPricing.baseKm}
                  onChange={e => setEditPricing({ ...editPricing, baseKm: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Highway Rate Beyond Base (₹/km)
                </label>
                <input
                  type="number"
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white font-mono font-bold"
                  value={editPricing.ratePerKm}
                  onChange={e => setEditPricing({ ...editPricing, ratePerKm: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Minimum Transport Fare (₹)
                </label>
                <input
                  type="number"
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white font-mono font-bold"
                  value={editPricing.minimumFare}
                  onChange={e => setEditPricing({ ...editPricing, minimumFare: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <h3 style={fontDisplay} className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3 pt-4">
              Helper Rate Rule (Requirement 6)
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Rate Per Helper (₹)
                </label>
                <input
                  type="number"
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white font-mono font-bold text-amber-700"
                  value={editPricing.helperRate}
                  onChange={e => setEditPricing({ ...editPricing, helperRate: Number(e.target.value) })}
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Formula: Helper Charge = Helpers × ₹{editPricing.helperRate} (1 = ₹{editPricing.helperRate}, 2 = ₹{editPricing.helperRate * 2})
                </p>
              </div>
            </div>

            <h3 style={fontDisplay} className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3 pt-4">
              Weight Pricing Tiers (Requirement 5)
            </h3>

            <div className="space-y-3">
              {editPricing.weightTiers && editPricing.weightTiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex-1 font-bold text-slate-800">
                    {tier.label} (Up to {tier.maxKg} kg)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Surcharge: ₹</span>
                    <input
                      type="number"
                      value={tier.surcharge}
                      onChange={e => {
                        const updated = [...editPricing.weightTiers];
                        updated[idx].surcharge = Number(e.target.value);
                        setEditPricing({ ...editPricing, weightTiers: updated });
                      }}
                      className="w-28 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                style={fontDisplay}
                className="btn-primary px-8 py-3.5 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20"
              >
                Save & Apply Pricing Updates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT LOGS                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-slide-up">
          <div className="premium-card overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-500 tracking-wider">
              Recent System & Administrative Actions
            </div>
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">No audit logs recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50">
                    <div>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] mr-2">
                        {log.action}
                      </span>
                      <span className="text-slate-700 font-medium">{log.details}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-400 block text-[10px] font-mono">{log.created_at}</span>
                      <span className="text-[10px] text-slate-500 font-bold">By: {log.performed_by}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN VEHICLE & DRIVER MODAL (Strict Overlap & Capacity)         */}
      {/* ========================================================================= */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 style={fontDisplay} className="text-xl font-bold text-slate-800">
                  Assign Lorry & Driver
                </h3>
                <span className="text-xs font-mono text-slate-400">Order ID: {assignModalBooking.booking_id}</span>
              </div>
              <button 
                onClick={() => setAssignModalBooking(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Consignment Specs Snapshot */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Route:</span>
                <span className="font-bold text-slate-800">{assignModalBooking.pickup} → {assignModalBooking.delivery}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-bold text-slate-800">{assignModalBooking.expected_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payload Weight:</span>
                <span className="font-bold text-amber-700">
                  {assignModalBooking.weight_kg ? `${assignModalBooking.weight_kg.toLocaleString('en-IN')} kg` : assignModalBooking.average_weight}
                </span>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Select Registered Lorry *
                </label>
                <select
                  value={assignForm.vehicle_no}
                  onChange={e => {
                    const chosen = e.target.value;
                    const defDriver = chosen === "TN 77AY 3006" ? "Senthil" : "Chithiraj";
                    setAssignForm({ ...assignForm, vehicle_no: chosen, driver: defDriver });
                  }}
                  className="w-full text-xs font-bold px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white"
                  required
                >
                  <option value="TN 77AY 3006">TN 77AY 3006 — Heavy Commercial Lorry (8 Ton / 8,000 kg)</option>
                  <option value="TN28 BF 1256">TN28 BF 1256 — Medium Commercial Lorry (3.5 Ton / 3,500 kg)</option>
                </select>
              </div>

              <div>
                <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Select Authorized Driver *
                </label>
                <select
                  value={assignForm.driver}
                  onChange={e => setAssignForm({ ...assignForm, driver: e.target.value })}
                  className="w-full text-xs font-bold px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white"
                  required
                >
                  {drivers.filter(d => d.status === 'Active').map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Approved Final Fare (₹)
                  </label>
                  <input
                    type="number"
                    value={assignForm.approved_fare}
                    onChange={e => setAssignForm({ ...assignForm, approved_fare: e.target.value })}
                    className="w-full text-xs font-mono font-bold px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Trip Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={assignForm.trip_duration_days}
                    onChange={e => setAssignForm({ ...assignForm, trip_duration_days: e.target.value })}
                    className="w-full text-xs font-mono font-bold px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssignModalBooking(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={fontDisplay}
                  className="flex-1 btn-primary py-3 rounded-xl text-xs font-bold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FULL DETAILS VIEW MODAL                                          */}
      {/* ========================================================================= */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
              <div>
                <h3 style={fontDisplay} className="text-xl font-bold text-slate-900">
                  Consignment #{selectedBookingForDetails.booking_id}
                </h3>
                <span className="text-xs text-slate-400">Created: {selectedBookingForDetails.created_at}</span>
              </div>
              <button 
                onClick={() => setSelectedBookingForDetails(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">Customer Info</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-800">{selectedBookingForDetails.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-bold text-slate-800">{selectedBookingForDetails.customer_phone}</span>
                </div>
                {selectedBookingForDetails.customer_address && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Billing Address:</span>
                    <span className="font-medium text-slate-700 text-right max-w-[240px]">{selectedBookingForDetails.customer_address}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">Location Addresses</h4>
                <div>
                  <span className="font-bold text-blue-600 block mb-0.5">Pickup Address ({selectedBookingForDetails.pickup}):</span>
                  <p className="text-slate-700 font-medium leading-relaxed">{selectedBookingForDetails.pickup_address || selectedBookingForDetails.pickup}</p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-amber-600 block mb-0.5">Delivery Address ({selectedBookingForDetails.delivery}):</span>
                  <p className="text-slate-700 font-medium leading-relaxed">{selectedBookingForDetails.delivery_address || selectedBookingForDetails.delivery}</p>
                </div>
                {selectedBookingForDetails.instructions && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-500 block mb-0.5">Instructions:</span>
                    <p className="text-slate-700 italic">{selectedBookingForDetails.instructions}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">Consignment & Fare</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Load Type:</span>
                  <span className="font-bold text-slate-800">{selectedBookingForDetails.load_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Weight:</span>
                  <span className="font-bold text-slate-800">{selectedBookingForDetails.average_weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Helpers:</span>
                  <span className="font-bold text-slate-800">{selectedBookingForDetails.helpers} helper(s) (₹{selectedBookingForDetails.helper_charge})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Fare:</span>
                  <span className="font-bold text-slate-800">₹{selectedBookingForDetails.estimated_price}</span>
                </div>
                {selectedBookingForDetails.approved_fare && (
                  <div className="flex justify-between text-green-700 font-bold">
                    <span>Approved Fare:</span>
                    <span>₹{selectedBookingForDetails.approved_fare}</span>
                  </div>
                )}
                {selectedBookingForDetails.cancellation_reason && (
                  <div className="pt-2 border-t border-slate-200 text-red-600">
                    <span className="font-bold block">Cancellation Reason:</span>
                    <span>{selectedBookingForDetails.cancellation_reason}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REJECT / CANCEL MODAL                                            */}
      {/* ========================================================================= */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-up">
            <h3 style={fontDisplay} className="text-lg font-bold text-slate-800 mb-2">
              Cancel Consignment #{rejectModalBooking.booking_id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Please enter the cancellation reason for the customer's shipment record.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white h-24 resize-none"
                required
              />

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setRejectModalBooking(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
