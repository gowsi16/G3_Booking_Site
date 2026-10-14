import React from 'react';
import { Truck } from 'lucide-react';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

export default function About() {
  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 mx-auto bg-green-50 text-green-700 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-200">
          <Truck size={36} />
        </div>
        <h1 style={fontDisplay} className="text-4xl font-bold mb-4 text-slate-800 tracking-tight">About G3 Transport</h1>
        <p style={fontBody} className="text-lg text-slate-500">Connecting businesses with reliable logistics.</p>
      </div>

      <div className="premium-card p-10 md:p-14 mb-12 space-y-8 text-slate-600 border border-green-100" style={fontBody}>
        <p className="text-lg leading-relaxed">
          G3 Transport is a premier logistics and transportation service based in Salem, Tamil Nadu. 
          We specialize in providing fast, reliable, and secure lorry booking services for both intra-city 
          and inter-city transport.
        </p>
        <p className="text-lg leading-relaxed">
          Whether you need to move household goods, heavy industrial equipment, or fragile items, 
          our fleet of modern vehicles and experienced drivers ensures your cargo reaches its destination safely and on time.
        </p>

        <div className="pt-8 border-t border-green-100">
          <h3 style={fontDisplay} className="text-2xl font-bold mb-4 text-slate-800">Our Mission</h3>
          <p className="text-lg leading-relaxed">
            To simplify logistics for everyone by providing a transparent, easy-to-use, and highly efficient 
            platform for booking and tracking transport vehicles.
          </p>
        </div>

        <div className="pt-8 border-t border-green-100 bg-green-50/50 -mx-10 md:-mx-14 px-10 md:px-14 pb-10 md:pb-14 -mb-10 md:-mb-14 rounded-b-xl border-t">
          <h3 style={fontDisplay} className="text-2xl font-bold mb-6 text-slate-800">Contact Us</h3>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="font-bold text-slate-800 min-w-[80px]">Address:</span> 
              <span>3/93, Kalaignar Street, Vellalagundam, Vazhapady Taluk, Salem – 636111</span>
            </li>
            <li className="flex gap-4">
              <span className="font-bold text-slate-800 min-w-[80px]">Phone:</span> 
              <span className="font-mono text-green-700 font-semibold text-lg tracking-wide">9488289991, 9080942982</span>
            </li>
            <li className="flex gap-4">
              <span className="font-bold text-slate-800 min-w-[80px]">Email:</span> 
              <span>gthreetransport@gmail.com, gowsilan16@gmail.com</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
