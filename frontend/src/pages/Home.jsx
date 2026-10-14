import React from 'react';
import { Truck, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

export default function Home() {
  return (
    <div className="w-full pb-12 animate-slide-up">
      {/* Hero Section */}
      <section className="hero-bg rounded-2xl p-8 md:p-16 mb-12 flex items-center justify-center min-h-[450px]">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 style={fontDisplay} className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-white drop-shadow-lg">
            Premium Logistics for Your Business
          </h1>
          <p style={fontBody} className="text-lg md:text-xl mb-10 text-gray-100 drop-shadow-md">
            Book a lorry instantly, track it in real-time, and get your goods delivered safely with G3 Transport's elite fleet.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/book" 
              style={fontDisplay}
              className="btn-primary px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-green-900/30 transition-all"
            >
              Book a Lorry <Truck size={18} />
            </Link>
            <Link 
              to="/track" 
              style={fontDisplay}
              className="glass-dark text-white px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
            >
              Track Shipment <Search size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 px-2">
        {[
          { title: "Instant Booking", desc: "Get real-time pricing and availability for various lorry sizes instantly.", icon: Truck },
          { title: "Live Tracking", desc: "Know exactly where your shipment is at all times with real-time updates.", icon: Search },
          { title: "Secure Transport", desc: "Verified drivers and highly secure vehicles ensure complete safety.", icon: ShieldCheck }
        ].map((f, i) => (
          <div key={i} className="premium-card p-8 text-center flex flex-col items-center border border-green-100 hover:border-green-300">
            <div className="w-16 h-16 rounded-full mb-6 flex items-center justify-center bg-green-50 text-green-700">
              <f.icon className="text-green-600" size={28} />
            </div>
            <h3 style={fontDisplay} className="text-xl font-bold mb-3 text-slate-800">{f.title}</h3>
            <p style={fontBody} className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
