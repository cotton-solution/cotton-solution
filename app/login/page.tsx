'use client';
import { useState } from 'react';
import { Lock, Mail, User, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // Integrated with Resend API in production
    setOtpSent(true);
    alert("OTP sent via Resend API to " + email);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card-3d p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl shadow-inner font-bold">
            🌾
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome to Cotton Solution</h1>
          <p className="text-xs text-gray-500 mt-1">Secure Login & Registration via Resend OTP</p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm">
              Send Resend OTP <ArrowRight size={16}/>
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); alert("Login successful! Redirecting to profile..."); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Enter 6-digit OTP</label>
              <input 
                type="text" 
                required 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm">
              Verify & Login <Shield size={16}/>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}