import React, { useState, useRef, useEffect } from "react";
import { Truck, MapPin, Check, ChevronRight, ChevronLeft, Search, ShieldCheck, Package } from "lucide-react";

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

const inputCls = "w-full text-sm px-4 py-3 rounded-lg border outline-none bg-white transition-shadow focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 text-slate-800";

const TAMIL_NADU_CITIES = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", 
  "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Dindigul", 
  "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Ooty", "Kanyakumari"
];

const LOAD_OPTIONS = [
  "Sugarcane", "Jaggery", "Textiles", "Furniture", "Electronics", 
  "Agricultural Produce", "Machinery", "FMCG", "Other"
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
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {filteredOptions.map((opt) => (
            <li 
              key={opt} 
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors"
              onClick={() => {
                onChange(opt);
                setShowSuggestions(false);
              }}
            >
              {opt}
            </li>
          ))}
          {showCustom && (
            <li 
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-blue-600 font-medium transition-colors border-t border-slate-100"
              onClick={() => {
                onChange(value);
                setShowSuggestions(false);
              }}
            >
              Use "{value}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={fontBody} className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Booking() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pickup: "",
    delivery: "",
    load_type: "",
    average_weight: "",
    expected_date: "",
    helpers: 0,
    name: "",
    phone: "",
    email: "",
    gst_number: "",
    company: "",
  });

  const [searchResult, setSearchResult] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  const handleSearch = async () => {
    if (!form.pickup || !form.delivery) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/availability?pickup=${form.pickup}&delivery=${form.delivery}`);
      const data = await res.json();
      setSearchResult(data);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateCustomerAndBooking = async () => {
    setLoading(true);
    try {
      const cusRes = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const cusData = await cusRes.json();
      const customerId = cusData.customer_id;

      const distanceCharge = calculatePrice(); // We will recalculate just to be sure
      const bookingPayload = {
        customer_id: customerId,
        pickup: form.pickup,
        delivery: form.delivery,
        distance: searchResult.distance,
        load_type: form.load_type,
        average_weight: form.average_weight,
        helpers: form.helpers,
        expected_date: form.expected_date,
        estimated_price: distanceCharge
      };

      const bkRes = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
      const bkData = await bkRes.json();
      
      setBookingResult({
        customer_id: customerId,
        booking_id: bkData.booking_id
      });
      setStep(5);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const calculatePrice = () => {
    if (!searchResult || !form.average_weight) return 0;
    
    const d = searchResult.distanceValue;
    let distanceCharge = 0;
    if (d <= 100) distanceCharge = d * 20;
    else if (d <= 300) distanceCharge = d * 25;
    else distanceCharge = d * 30;

    let weightCharge = 0;
    const w = form.average_weight;
    if (w === "Up to 500 kg") weightCharge = 750;
    else if (w === "1 Ton") weightCharge = 1500;
    else if (w === "2 Tons") weightCharge = 3000;
    else if (w === "3 Tons") weightCharge = 4500;
    else if (w === "4 Tons") weightCharge = 6000;
    else if (w === "5 Tons") weightCharge = 7500;
    else if (w === "6 Tons") weightCharge = 9000;
    else if (w === "7 Tons") weightCharge = 10500;

    const helperCharge = form.helpers * 500;

    return distanceCharge + weightCharge + helperCharge;
  };

  const weightOptions = ["Up to 500 kg", "1 Ton", "2 Tons", "3 Tons", "4 Tons", "5 Tons", "6 Tons", "7 Tons"];

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <h1 style={fontDisplay} className="text-3xl font-bold text-slate-800 tracking-tight">Book a Lorry</h1>
        <div className="flex items-center gap-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step >= i ? 'bg-amber-500' : 'bg-slate-200'}`} style={{ width: step === i ? '24px' : '8px' }} />
          ))}
        </div>
      </div>

      <div className="premium-card p-6 sm:p-10 relative overflow-hidden">
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 style={fontDisplay} className="text-2xl font-bold mb-8 text-slate-800">Where to?</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <Field label="Pickup Location">
                <AutocompleteField 
                  value={form.pickup} 
                  onChange={(val) => setForm({ ...form, pickup: val })} 
                  placeholder="e.g. Salem" 
                  icon={MapPin}
                  iconColor="text-blue-500" 
                  options={TAMIL_NADU_CITIES}
                />
              </Field>
              <Field label="Delivery Location">
                <AutocompleteField 
                  value={form.delivery} 
                  onChange={(val) => setForm({ ...form, delivery: val })} 
                  placeholder="e.g. Chennai" 
                  icon={MapPin}
                  iconColor="text-amber-500" 
                  options={TAMIL_NADU_CITIES}
                />
              </Field>
            </div>
            <button
              onClick={handleSearch} disabled={!form.pickup || !form.delivery || loading}
              style={fontDisplay}
              className={`w-full px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
                (!form.pickup || !form.delivery || loading) ? 'bg-slate-100 text-slate-400' : 'btn-secondary'
              }`}
            >
              {loading ? "Searching..." : "Search Availability"} <Search size={18} />
            </button>
          </div>
        )}

        {step === 2 && searchResult && (
          <div className="animate-slide-up">
            <button onClick={() => setStep(1)} className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-6 hover:text-slate-800 transition-colors"><ChevronLeft size={14}/> Back</button>
            <h2 style={fontDisplay} className="text-2xl font-bold mb-8 text-slate-800">Available Options</h2>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex-1 p-5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><MapPin size={24}/></div>
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-1 tracking-wider">Distance</p>
                  <p style={fontDisplay} className="text-2xl font-bold text-slate-800">{searchResult.distance}</p>
                </div>
              </div>
            </div>
            <h3 style={fontBody} className="font-bold text-slate-800 mb-4">Available Vehicles</h3>
            <div className="space-y-3 mb-10">
              {searchResult.vehicles.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="bg-green-100 p-1 rounded-full"><Check size={16} className="text-green-600" /></div>
                  <span style={fontBody} className="font-semibold text-slate-800">{v.vehicle_type}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(3)} style={fontDisplay}
              className="w-full btn-secondary px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2"
            >
              Continue to Transport Details <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 3 && searchResult && (
          <div className="animate-slide-up">
            <button onClick={() => setStep(2)} className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-6 hover:text-slate-800 transition-colors"><ChevronLeft size={14}/> Back</button>
            <h2 style={fontDisplay} className="text-2xl font-bold mb-8 text-slate-800">Transport Details</h2>
            <div className="space-y-8 mb-10">
              <Field label="Load Type (e.g. Sugarcane)">
                <AutocompleteField 
                  value={form.load_type} 
                  onChange={(val) => setForm({ ...form, load_type: val })} 
                  placeholder="Start typing your load type..." 
                  icon={Package}
                  iconColor="text-slate-500" 
                  options={LOAD_OPTIONS}
                  allowCustom={true}
                />
              </Field>
              <Field label="Expected Date">
                <input 
                  type="date"
                  className={inputCls}
                  value={form.expected_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({...form, expected_date: e.target.value})}
                />
              </Field>
              <Field label="Average Weight">
                <div className="flex flex-wrap gap-3">
                  {weightOptions.map(w => (
                    <button key={w} onClick={() => setForm({...form, average_weight: w})}
                      className="px-4 py-2 border rounded-full text-sm font-medium transition-all"
                      style={{ 
                        borderColor: form.average_weight === w ? '#F59E0B' : '#E2E8F0',
                        background: form.average_weight === w ? '#FFFBEB' : 'white',
                        color: form.average_weight === w ? '#B45309' : '#475569'
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Need Helpers?">
                <div className="flex gap-3">
                  {[0,1,2,3].map(h => (
                    <button key={h} onClick={() => setForm({...form, helpers: h})}
                      className="w-14 h-14 border rounded-xl text-lg font-semibold flex justify-center items-center transition-all"
                      style={{ 
                        borderColor: form.helpers === h ? '#3B82F6' : '#E2E8F0',
                        background: form.helpers === h ? '#EFF6FF' : 'white',
                        color: form.helpers === h ? '#1D4ED8' : '#475569'
                      }}
                    >
                      {h === 0 ? "No" : h}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            
            {form.load_type && form.average_weight && (
              <div className="mb-10 p-6 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Final Estimated Price</p>
                  <p style={fontDisplay} className="text-3xl font-bold text-amber-400">₹{calculatePrice().toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300">Distance: {searchResult.distance}</p>
                  <p className="text-sm text-slate-300">Helpers: {form.helpers}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(4)} disabled={!form.load_type || !form.average_weight || !form.expected_date}
              style={fontDisplay}
              className={`w-full px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
                (!form.load_type || !form.average_weight || !form.expected_date) ? 'bg-slate-100 text-slate-400' : 'btn-secondary'
              }`}
            >
              Enter Customer Details <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up">
            <button onClick={() => setStep(3)} className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-6 hover:text-slate-800 transition-colors"><ChevronLeft size={14}/> Back</button>
            <h2 style={fontDisplay} className="text-2xl font-bold mb-8 text-slate-800">Customer Details</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <Field label="Name *">
                <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Raj Kumar" />
              </Field>
              <Field label="Phone Number *">
                <input className={inputCls} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="9876543210" />
              </Field>
              <Field label="Email (Optional)">
                <input className={inputCls} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="raj@gmail.com" />
              </Field>
              <Field label="Company Name (Optional)">
                <input className={inputCls} value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="ABC Traders" />
              </Field>
              <div className="md:col-span-2">
                <Field label="GST Number (Optional)">
                  <input className={inputCls} value={form.gst_number} onChange={e => setForm({...form, gst_number: e.target.value})} placeholder="33ABCDE1234F1Z5" />
                </Field>
              </div>
            </div>
            <button
              onClick={handleCreateCustomerAndBooking} disabled={!form.name || !form.phone || loading}
              style={fontDisplay}
              className={`w-full px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
                (!form.name || !form.phone || loading) ? 'bg-slate-100 text-slate-400' : 'btn-primary'
              }`}
            >
              {loading ? "Processing..." : "Confirm Booking"} <Check size={18} />
            </button>
          </div>
        )}

        {step === 5 && bookingResult && (
          <div className="text-center py-8 animate-slide-up">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-8 bg-green-100">
              <ShieldCheck size={40} className="text-green-600" />
            </div>
            <h2 style={fontDisplay} className="text-3xl font-bold mb-3 text-slate-800">Booking Confirmed!</h2>
            <p style={fontBody} className="text-base mb-10 text-slate-500">Your premium lorry has been successfully booked.</p>
            
            <div className="text-left bg-slate-50 border border-slate-100 rounded-2xl p-6 max-w-lg mx-auto space-y-4 mb-10">
              {[
                ["Booking ID", bookingResult.booking_id],
                ["Customer ID", bookingResult.customer_id],
                ["Route", `${form.pickup} → ${form.delivery}`],
                ["Expected Date", form.expected_date],
                ["Load Type", form.load_type],
                ["Weight", form.average_weight],
                ["Helpers", form.helpers.toString()],
                ["Total Price", `₹${calculatePrice().toLocaleString()}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">{k}</span>
                  <span className="text-sm font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="btn-primary px-8 py-3.5 rounded-xl text-sm font-bold w-full sm:w-auto" style={fontDisplay}>
                Make Payment
              </button>
              <button onClick={() => window.location.reload()} className="px-8 py-3.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors w-full sm:w-auto" style={fontDisplay}>
                New Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
