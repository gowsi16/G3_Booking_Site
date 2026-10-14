import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Truck, MapPin, Check, ChevronRight, ChevronLeft, Search, 
  ShieldCheck, Package, Lock, AlertCircle, Info, Calendar, 
  ArrowRight, CheckCircle2, Phone, Mail, FileText, Sparkles, Scale
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

const inputCls = "w-full text-sm px-4 py-3 rounded-xl border outline-none bg-white transition-all focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 border-slate-200 text-slate-800 placeholder-slate-400";

const TAMIL_NADU_CITIES = [
  "Salem", "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", 
  "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Dindigul", 
  "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Ooty", "Kanyakumari",
  "Tirunelveli", "Hosur", "Dharmapuri", "Namakkal", "Krishnagiri", "Cuddalore", "Villupuram", "Puducherry", "Bengaluru"
];

const LOAD_OPTIONS = [
  "Sugarcane", "Jaggery", "Textiles", "Agricultural Produce", "Machinery", 
  "FMCG Goods", "Furniture", "Electronics", "Construction Materials", "Industrial Parts", "Other"
];

const WEIGHT_PRESETS = [
  { label: "500 kg", kg: 500 },
  { label: "1 Ton (1,000 kg)", kg: 1000 },
  { label: "2 Tons (2,000 kg)", kg: 2000 },
  { label: "3.5 Tons (3,500 kg)", kg: 3500 },
  { label: "5 Tons (5,000 kg)", kg: 5000 },
  { label: "7 Tons (7,000 kg)", kg: 7000 },
  { label: "8 Tons (8,000 kg)", kg: 8000 }
];

function AutocompleteField({ value, onChange, placeholder, icon: Icon, iconColor, options, allowCustom }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes((value || "").toLowerCase())
  );

  const exactMatch = options.some(opt => opt.toLowerCase() === (value || "").toLowerCase());
  const showCustom = allowCustom && value && !exactMatch;
  const hasOptions = filteredOptions.length > 0 || showCustom;

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <Icon className={`absolute left-3.5 top-3.5 ${iconColor}`} size={18} />
      <input 
        className={`${inputCls} pl-10`} 
        placeholder={placeholder}
        value={value} 
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
      />
      {showSuggestions && hasOptions && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-auto">
          {filteredOptions.map((opt) => (
            <li 
              key={opt} 
              className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer text-sm text-slate-700 transition-colors flex items-center justify-between"
              onClick={() => {
                onChange(opt);
                setShowSuggestions(false);
              }}
            >
              <span className="font-medium">{opt}</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">Tamil Nadu</span>
            </li>
          ))}
          {showCustom && (
            <li 
              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm text-blue-600 font-medium transition-colors border-t border-slate-100"
              onClick={() => {
                onChange(value);
                setShowSuggestions(false);
              }}
            >
              Use custom "{value}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children, required, subtext }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {subtext && <span className="text-[11px] text-slate-400">{subtext}</span>}
      </div>
      {children}
    </div>
  );
}

export default function Booking() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State (Customer doesn't pick lorry!)
  const [form, setForm] = useState({
    pickup: "",
    delivery: "",
    expected_date: new Date().toISOString().split("T")[0],
    load_type: "",
    weight_val: 3500,
    weight_unit: "kg", // "kg" | "tons"
    helpers: 0,
    name: "",
    phone: "",
    email: "",
    customer_address: "",
    pickup_address: "",
    delivery_address: "",
    instructions: ""
  });

  const [searchResult, setSearchResult] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [fareBreakdown, setFareBreakdown] = useState(null);

  // Sync user profile if logged in
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || f.name,
        phone: user.phone || f.phone,
        email: user.email || f.email,
        customer_address: user.customer_address || f.customer_address
      }));
    }
  }, [user]);

  // Normalized weight in kilograms
  const getNormalizedWeightKg = () => {
    const val = parseFloat(form.weight_val) || 0;
    return form.weight_unit === "tons" ? Math.round(val * 1000) : Math.round(val);
  };

  // Live recalculate server-verified fare estimate whenever route, weight, or helpers change
  useEffect(() => {
    if (!searchResult || !searchResult.distanceValue) return;

    const distanceKm = searchResult.distanceValue;
    const weightKg = getNormalizedWeightKg();
    const helpersCount = parseInt(form.helpers, 10) || 0;

    // Fetch fare calculation from server (Backend is source of truth)
    fetch("http://localhost:5000/api/calculate-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distanceKm,
        weight: weightKg,
        weight_unit: "kg",
        helpers: helpersCount
      })
    })
      .then(res => res.json())
      .then(data => {
        setFareBreakdown(data);
      })
      .catch(err => {
        console.error("Price calculation error:", err);
      });
  }, [searchResult, form.weight_val, form.weight_unit, form.helpers]);

  // Handler: Calculate Road Distance & Check Fleet Availability
  const handleSearchRoute = async () => {
    if (!form.pickup || !form.delivery) {
      setErrorMsg("Please enter both Pickup and Delivery locations.");
      return;
    }
    if (form.pickup.trim().toLowerCase() === form.delivery.trim().toLowerCase()) {
      setErrorMsg("Pickup and Delivery locations cannot be identical.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const url = `http://localhost:5000/api/availability?pickup=${encodeURIComponent(form.pickup)}&delivery=${encodeURIComponent(form.delivery)}&expected_date=${encodeURIComponent(form.expected_date)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Unable to calculate road distance and fleet availability");
      }
      const data = await res.json();
      setSearchResult(data);
      setStep(2);
    } catch (err) {
      console.error(err);
      setErrorMsg("Routing service error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Submit Booking
  const handleSubmitBooking = async () => {
    if (!user || !user.customer_id) {
      setErrorMsg("Please log in with your customer account to submit a booking.");
      navigate("/login?redirect=/book");
      return;
    }

    if (!form.name || !form.phone) {
      setErrorMsg("Customer name and phone number are required.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const normalizedKg = getNormalizedWeightKg();
      const payload = {
        customer_id: user.customer_id,
        pickup: form.pickup.trim(),
        delivery: form.delivery.trim(),
        pickup_address: form.pickup.trim(),
        delivery_address: form.delivery.trim(),
        customer_address: form.customer_address.trim(),
        distance: searchResult.distance,
        distanceKm: searchResult.distanceValue,
        load_type: form.load_type,
        average_weight: `${form.weight_val} ${form.weight_unit === 'tons' ? 'Tons' : 'kg'}`,
        weight_kg: normalizedKg,
        helpers: parseInt(form.helpers, 10) || 0,
        expected_date: form.expected_date,
        instructions: form.instructions
      };

      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit booking");
      }

      setBookingResult({
        booking_id: data.booking_id,
        customer_id: user.customer_id,
        estimated_price: data.estimated_price,
        helper_charge: data.helper_charge,
        weight_kg: data.weight_kg,
        status: data.status,
        breakdown: data.breakdown,
        capacityAlert: data.capacityAlert
      });
      setStep(5);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit transport request");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // BARRIER IF NOT LOGGED IN (Requirement 2)
  // -------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="w-full max-w-xl mx-auto pt-8 pb-16 animate-slide-up">
        <div className="premium-card p-8 sm:p-12 text-center border-t-4 border-amber-500 shadow-xl">
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 bg-amber-50 text-amber-600 shadow-inner">
            <Lock size={38} />
          </div>

          <h2 style={fontDisplay} className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
            Customer Login Required
          </h2>
          <p style={fontBody} className="text-slate-600 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Please log in with your customer account or register as a client before accessing or submitting a transport booking.
          </p>

          <div className="space-y-4">
            <Link
              to="/login?redirect=/book"
              style={fontDisplay}
              className="w-full btn-primary px-8 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              Log In to Book Transport <ChevronRight size={18} />
            </Link>

            <div className="text-center pt-1">
              <Link
                to="/login?redirect=/book"
                className="text-xs font-semibold text-slate-500 hover:text-amber-600 transition-colors"
              >
                Don't have an account? <span className="text-amber-600 font-bold underline">Create New Account</span>
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-600"/> Verified Fleet</span>
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-600"/> Real Road Distance</span>
            <span className="flex items-center gap-1.5"><Truck size={14} className="text-amber-600"/> Admin Assigned Lorry</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // BOOKING WIZARD (LOGGED IN CUSTOMER)
  // -------------------------------------------------------------------------
  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up pb-16">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
              <CheckCircle2 size={12} /> Logged In Customer
            </span>
            <span className="text-xs font-mono text-slate-400">ID: {user.customer_id}</span>
          </div>
          <h1 style={fontDisplay} className="text-3xl font-bold text-slate-800 tracking-tight">
            Book Transport Consignment
          </h1>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${step >= i ? 'bg-amber-500' : 'bg-slate-200'}`} 
              style={{ width: step === i ? '32px' : '8px' }} 
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200 flex items-center gap-3 animate-slide-up">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="premium-card p-6 sm:p-10 relative overflow-hidden shadow-xl border border-slate-200/80">
        
        {/* ========================================================================= */}
        {/* STEP 1: ROUTE & ROAD DISTANCE CALCULATION                                 */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="mb-8">
              <h2 style={fontDisplay} className="text-2xl font-bold text-slate-800">Transport Route & Date</h2>
              <p style={fontBody} className="text-sm text-slate-500 mt-1">
                Enter your pickup and delivery hubs to calculate genuine highway road distance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Field label="Pickup City / Hub" required>
                <AutocompleteField 
                  value={form.pickup} 
                  onChange={(val) => setForm({ ...form, pickup: val })} 
                  placeholder="e.g. Salem" 
                  icon={MapPin}
                  iconColor="text-blue-500" 
                  options={TAMIL_NADU_CITIES}
                  allowCustom={true}
                />
              </Field>
              <Field label="Delivery City / Hub" required>
                <AutocompleteField 
                  value={form.delivery} 
                  onChange={(val) => setForm({ ...form, delivery: val })} 
                  placeholder="e.g. Chennai" 
                  icon={MapPin}
                  iconColor="text-amber-500" 
                  options={TAMIL_NADU_CITIES}
                  allowCustom={true}
                />
              </Field>
            </div>

            <div className="mb-8">
              <Field label="Preferred Pickup Date" required subtext="Used to verify lorry schedule availability">
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="date"
                    className={`${inputCls} pl-10`}
                    value={form.expected_date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                  />
                </div>
              </Field>
            </div>

            {/* Popular Tamil Nadu Routes */}
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Popular Tamil Nadu Highway Routes:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { from: "Salem", to: "Chennai" },
                  { from: "Salem", to: "Coimbatore" },
                  { from: "Salem", to: "Madurai" },
                  { from: "Chennai", to: "Coimbatore" },
                  { from: "Chennai", to: "Tiruchirappalli" },
                  { from: "Salem", to: "Erode" }
                ].map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, pickup: r.from, delivery: r.to })}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-600 transition-colors shadow-2xs"
                  >
                    {r.from} → {r.to}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSearchRoute} 
              disabled={!form.pickup || !form.delivery || loading}
              style={fontDisplay}
              className={`w-full px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                (!form.pickup || !form.delivery || loading) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'btn-secondary text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculating Highway Distance...
                </>
              ) : (
                <>
                  Calculate Road Distance & Check Fleet Availability <Search size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CONSIGNMENT DETAILS (WEIGHT & HELPERS)                             */}
        {/* NO CUSTOMER VEHICLE SELECTOR (Requirement 3)                              */}
        {/* ========================================================================= */}
        {step === 2 && searchResult && (
          <div className="animate-slide-up">
            <button 
              onClick={() => setStep(1)} 
              className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-6 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={14}/> Change Route / Date
            </button>

            {/* Route & Distance Callout Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white mb-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl text-amber-400 shrink-0">
                  <MapPin size={28}/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded">
                      {searchResult.routeType || "Actual Road Route"}
                    </span>
                    <span className="text-xs text-slate-300">({searchResult.source})</span>
                  </div>
                  <h3 style={fontDisplay} className="text-xl font-bold mt-1 text-white">
                    {searchResult.pickup} <ArrowRight className="inline mx-1 text-amber-400" size={16}/> {searchResult.delivery}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">Scheduled for: <span className="text-amber-300 font-bold">{form.expected_date}</span></p>
                </div>
              </div>
              <div className="md:text-right border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                <p className="text-xs uppercase text-slate-400 font-bold tracking-wider">Driving Highway Distance</p>
                <p style={fontDisplay} className="text-3xl font-extrabold text-amber-400">
                  {searchResult.distance}
                </p>
              </div>
            </div>

            {/* Fleet Availability Notice Banner (No vehicle selection) */}
            <div className="mb-8 p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-3">
              <Truck className="text-blue-600 mt-1 shrink-0" size={22} />
              <div className="text-xs text-slate-700">
                <p className="font-bold text-slate-900 mb-0.5">Company Fleet Assignment Policy</p>
                <p className="mb-1 text-slate-600">
                  G3 Transport operates two registered commercial haulers: <strong>TN 77AY 3006</strong> (Heavy 8-Ton) and <strong>TN28 BF 1256</strong> (Medium 3.5-Ton).
                  Customers do not need to choose a lorry — our dispatch admin assigns the vehicle and driver matching your payload and route.
                </p>
                {searchResult.fleetStatusNote && (
                  <p className="font-semibold text-blue-900 mt-1">
                    {searchResult.fleetStatusNote}
                  </p>
                )}
              </div>
            </div>

            {/* Consignment Inputs */}
            <div className="space-y-6 mb-8">
              <Field label="Load Type" required>
                <AutocompleteField 
                  value={form.load_type} 
                  onChange={(val) => setForm({ ...form, load_type: val })} 
                  placeholder="e.g. Sugarcane, Textiles, Jaggery, FMCG, Machinery..." 
                  icon={Package}
                  iconColor="text-slate-500" 
                  options={LOAD_OPTIONS}
                  allowCustom={true}
                />
              </Field>

              {/* Weight Input with Unit Selector (kg or tons) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={fontBody} className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale size={14} className="text-slate-500" /> Consignment Weight *
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    Normalized: <strong className="text-slate-800">{getNormalizedWeightKg().toLocaleString('en-IN')} kg</strong> ({ (getNormalizedWeightKg() / 1000).toFixed(2) } Tons)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="sm:col-span-2 relative">
                    <input 
                      type="number"
                      step={form.weight_unit === "tons" ? "0.1" : "50"}
                      min="10"
                      max="15000"
                      className={`${inputCls}`}
                      placeholder={form.weight_unit === "tons" ? "e.g. 3.5" : "e.g. 3500"}
                      value={form.weight_val}
                      onChange={(e) => setForm({ ...form, weight_val: e.target.value })}
                    />
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        const currentKg = getNormalizedWeightKg();
                        setForm({ ...form, weight_unit: "kg", weight_val: currentKg });
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        form.weight_unit === "kg" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                      }`}
                    >
                      Kilograms (kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentKg = getNormalizedWeightKg();
                        setForm({ ...form, weight_unit: "tons", weight_val: (currentKg / 1000).toFixed(1) });
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        form.weight_unit === "tons" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                      }`}
                    >
                      Metric Tons
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  {WEIGHT_PRESETS.map(p => {
                    const isSelected = getNormalizedWeightKg() === p.kg;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          if (form.weight_unit === "tons") {
                            setForm({ ...form, weight_val: (p.kg / 1000).toString() });
                          } else {
                            setForm({ ...form, weight_val: p.kg.toString() });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isSelected 
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm" 
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {getNormalizedWeightKg() > 8000 && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>
                      Notice: Load weight ({getNormalizedWeightKg()} kg) exceeds standard maximum lorry capacity (8,000 kg). Dispatch administrator approval will be required.
                    </span>
                  </div>
                )}
              </div>

              {/* Helpers Selection: Business rule ₹800 per helper */}
              <Field label="Loading / Unloading Helpers Needed" subtext="Business rate: ₹800 per helper">
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4].map(h => {
                    const isSelected = parseInt(form.helpers, 10) === h;
                    const cost = h * 800;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setForm({ ...form, helpers: h })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected 
                            ? "border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20" 
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="text-base font-extrabold">{h === 0 ? "None" : `${h}`}</div>
                        <div className="text-[11px] font-mono mt-0.5 text-slate-500">
                          {h === 0 ? "₹0" : `₹${cost.toLocaleString('en-IN')}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            {/* Live Transparent Fare Calculation Breakdown Card */}
            {fareBreakdown && (
              <div className="mb-8 p-6 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 animate-slide-up">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400">
                      Transparent Transport Fare Breakdown
                    </span>
                    <h3 style={fontDisplay} className="text-lg font-bold text-white">
                      Estimated Road Transport Fare
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-mono">Road Distance:</span>
                    <span className="text-sm font-bold text-white ml-1.5">{searchResult.distance}</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300 font-mono mb-4">
                  <div className="flex justify-between">
                    <span>Base & Distance Fare (First {fareBreakdown.baseKm} km @ ₹{fareBreakdown.baseFare.toLocaleString('en-IN')} + {fareBreakdown.extraKm} extra km × ₹{fareBreakdown.perKmRate}/km):</span>
                    <span className="font-bold text-white">₹{fareBreakdown.distanceCharge.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight Surcharge ({fareBreakdown.weightTierLabel} • {fareBreakdown.weightKg.toLocaleString('en-IN')} kg):</span>
                    <span className="font-bold text-white">₹{fareBreakdown.weightSurcharge.toLocaleString('en-IN')}</span>
                  </div>
                  {fareBreakdown.helpers > 0 && (
                    <div className="flex justify-between">
                      <span>Helper Charges ({fareBreakdown.helpers} helper(s) × ₹800):</span>
                      <span className="font-bold text-amber-400">₹{fareBreakdown.helperCharge.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {fareBreakdown.totalEstimatedFare === fareBreakdown.minimumFare && (
                    <div className="flex justify-between text-blue-300">
                      <span>Minimum Transport Fare applied:</span>
                      <span className="font-bold">₹{fareBreakdown.minimumFare.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span style={fontDisplay} className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                      Total Estimated Fare
                    </span>
                    <span className="text-[11px] text-slate-400">Excludes tolls / taxes. Final quote approved by admin.</span>
                  </div>
                  <span style={fontDisplay} className="text-3xl font-extrabold text-amber-400">
                    ₹{fareBreakdown.totalEstimatedFare.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(3)} 
              disabled={!form.load_type || !form.weight_val || !fareBreakdown}
              style={fontDisplay}
              className={`w-full px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                (!form.load_type || !form.weight_val || !fareBreakdown) 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'btn-secondary text-white'
              }`}
            >
              Continue to Addresses & Customer Details <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CUSTOMER & SPECIFIC ADDRESSES (Requirement 7)                     */}
        {/* Removed Company / GST from standard form. Distinct pickup/delivery/contact*/}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="animate-slide-up">
            <button 
              onClick={() => setStep(2)} 
              className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-6 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={14}/> Back to Consignment Details
            </button>

            <div className="mb-8">
              <h2 style={fontDisplay} className="text-2xl font-bold text-slate-800">Customer Contact Details</h2>
              <p style={fontBody} className="text-sm text-slate-500 mt-1">
                Provide your contact details for consignment booking and dispatch confirmation.
              </p>
            </div>

            {/* Customer Contact Section */}
            <div className="mb-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full Name" required>
                  <input 
                    className={inputCls} 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    placeholder="Customer Full Name" 
                    required
                  />
                </Field>
                <Field label="Mobile Number" required>
                  <input 
                    className={inputCls} 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                    placeholder="10-digit mobile number" 
                    required
                  />
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Email Address">
                  <input 
                    className={inputCls} 
                    type="email"
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    placeholder="email@example.com" 
                  />
                </Field>
                <Field label="Customer Contact / Billing Address" required subtext="Residential or office billing address">
                  <input 
                    className={inputCls} 
                    value={form.customer_address} 
                    onChange={e => setForm({ ...form, customer_address: e.target.value })} 
                    placeholder="e.g. 3/93, Kalaignar Street, Vellalagundam, Salem" 
                    required
                  />
                </Field>
              </div>

              <div>
                <Field label="Additional Instructions (Optional)" subtext="Special cargo handling or dispatch notes">
                  <input 
                    className={inputCls} 
                    value={form.instructions} 
                    onChange={e => setForm({ ...form, instructions: e.target.value })} 
                    placeholder="e.g. Call customer upon lorry arrival; waterproof tarp required for cargo protection" 
                  />
                </Field>
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.name || !form.phone || !form.customer_address) {
                  setErrorMsg("Please complete all required customer contact details.");
                  return;
                }
                setErrorMsg("");
                setStep(4);
              }} 
              style={fontDisplay}
              className="w-full btn-secondary px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 text-white shadow-md"
            >
              Review & Verify Consignment Request <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: REVIEW & SUBMIT BOOKING                                           */}
        {/* ========================================================================= */}
        {step === 4 && fareBreakdown && (
          <div className="animate-slide-up">
            <button 
              onClick={() => setStep(3)} 
              className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-6 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={14}/> Back to Addresses
            </button>

            <div className="mb-6">
              <h2 style={fontDisplay} className="text-2xl font-bold text-slate-800">Review Booking Details</h2>
              <p style={fontBody} className="text-sm text-slate-500 mt-1">
                Please verify all consignment and address details before submitting to our dispatch team.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Route & Distance</span>
                  <span className="text-sm font-bold text-slate-800">{form.pickup} → {form.delivery} ({searchResult.distance})</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Pickup Date</span>
                  <span className="text-sm font-bold text-slate-800">{form.expected_date}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Lorry Assignment</span>
                  <span className="text-sm font-bold text-amber-700">Admin Assigned (TN 77AY 3006 / TN28 BF 1256)</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Load Type</span>
                  <span className="text-sm font-bold text-slate-800">{form.load_type}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Consignment Weight</span>
                  <span className="text-sm font-bold text-slate-800">{getNormalizedWeightKg().toLocaleString('en-IN')} kg ({ (getNormalizedWeightKg() / 1000).toFixed(2) } Tons)</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Helpers</span>
                  <span className="text-sm font-bold text-slate-800">{form.helpers} helper(s) (₹{ (parseInt(form.helpers, 10) * 800).toLocaleString('en-IN') })</span>
                </div>
              </div>

              <div className="pb-4 border-b border-slate-200 text-xs space-y-1.5">
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Customer Billing Address:</span>
                  <p className="text-slate-800 leading-relaxed font-medium">{form.customer_address}</p>
                </div>
                {form.instructions && (
                  <div className="pt-1">
                    <span className="font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Instructions:</span>
                    <p className="text-slate-600 italic font-medium">{form.instructions}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Estimated Transport Fare</span>
                  <span className="text-[11px] text-slate-500">Includes distance, weight tier, and ₹800 helper charges</span>
                </div>
                <span style={fontDisplay} className="text-2xl font-extrabold text-amber-600">
                  ₹{fareBreakdown.totalEstimatedFare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Dispatch Note:</strong> Upon submission, our dispatch admin will review your consignment, verify lorry schedule availability, and assign an official lorry and driver. You will be able to track status in real-time.
              </div>
            </div>

            <button
              onClick={handleSubmitBooking} 
              disabled={loading}
              style={fontDisplay}
              className={`w-full px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                loading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'btn-primary text-slate-900'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-700/30 border-t-slate-900 rounded-full animate-spin" />
                  Submitting Consignment Booking...
                </>
              ) : (
                <>
                  Confirm & Submit Transport Request <Check size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: BOOKING CONFIRMED SUCCESS VIEW                                    */}
        {/* ========================================================================= */}
        {step === 5 && bookingResult && (
          <div className="text-center py-6 animate-slide-up">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 bg-green-100 text-green-600 shadow-md">
              <ShieldCheck size={42} />
            </div>

            <h2 style={fontDisplay} className="text-3xl font-extrabold mb-2 text-slate-800">
              Transport Booking Submitted!
            </h2>
            <p style={fontBody} className="text-slate-600 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Your consignment request has been safely registered. Our dispatch admin will assign an available lorry and official driver shortly.
            </p>
            
            <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-lg mx-auto space-y-3 mb-8 shadow-sm">
              {[
                ["Booking ID", bookingResult.booking_id],
                ["Customer ID", bookingResult.customer_id],
                ["Route", `${form.pickup} → ${form.delivery}`],
                ["Highway Distance", searchResult.distance],
                ["Scheduled Pickup Date", form.expected_date],
                ["Consignment Type", form.load_type],
                ["Weight", `${bookingResult.weight_kg.toLocaleString('en-IN')} kg`],
                ["Helpers", `${form.helpers} helper(s) (₹${bookingResult.helper_charge.toLocaleString('en-IN')})`],
                ["Estimated Total Fare", `₹${bookingResult.estimated_price.toLocaleString('en-IN')}`],
                ["Lorry & Driver Status", "Pending Admin Review & Assignment"]
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center border-b border-slate-200/70 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">{k}</span>
                  <span className="text-sm font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to={`/track`}
                className="btn-primary px-8 py-3.5 rounded-xl text-sm font-bold w-full sm:w-auto text-center shadow-md shadow-amber-500/20" 
                style={fontDisplay}
              >
                Track This Shipment
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className="px-8 py-3.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors w-full sm:w-auto" 
                style={fontDisplay}
              >
                Book Another Consignment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
