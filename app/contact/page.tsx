'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    const { error } = await supabase.from('contact_messages').insert({ name, email, message });

    setSending(false);
    if (error) {
      setError('Something went wrong. Please try again.');
      return;
    }
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
  };

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

          {sent ? (
            <div className="flex flex-col items-center text-center py-10">
              <CheckCircle className="text-emerald-600 mb-3" size={40}/>
              <p className="text-gray-900 font-bold">Message sent successfully!</p>
              <p className="text-gray-600 text-sm mt-1">We'll get back to you soon.</p>
              <button onClick={() => setSent(false)} className="mt-4 text-emerald-600 text-sm font-bold hover:underline">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Name</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" placeholder="Hasnain Haider"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message</label>
                <textarea
                  rows={4} required value={message} onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" placeholder="Write your message here..."
                />
              </div>
              {error && <p className="text-red-600 text-xs font-bold">{error}</p>}
              <button
                type="submit" disabled={sending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
              >
                <Send size={16}/> {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
