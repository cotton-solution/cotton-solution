'use client';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Mail className="text-emerald-600"/> Contact Us
        </h1>
        <p className="text-gray-600 mt-1">Get in touch with Hasnain Corporation & H.A. Cotton Ginners.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="card-3d p-8 border border-gray-100 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><MapPin size={20}/></div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Location</h3>
              <p className="text-gray-600 text-sm">Chak No. 26 BC, Bahawalpur, Pakistan</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Phone size={20}/></div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Phone</h3>
              <p className="text-gray-600 text-sm">+92 (300) 0000000</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Mail size={20}/></div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Email</h3>
              <p className="text-gray-600 text-sm">contact@cottonsolution.com</p>
            </div>
          </div>
        </div>

        <div className="card-3d p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
          <form onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully!"); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Name</label>
              <input type="text" required className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" placeholder="Hasnain Haider"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <input type="email" required className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" placeholder="user@example.com"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message</label>
              <textarea rows={4} required className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" placeholder="Write your message here..."/>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm">
              <Send size={16}/> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}