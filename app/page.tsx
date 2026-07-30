'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Slide = {
  id: string;
  title: string;
  body_text: string | null;
  image_url: string | null;
};

const FALLBACK_SLIDES: Slide[] = [
  {
    id: 'fallback-1',
    title: 'Premium Cotton & Agricultural Commodities',
    body_text: 'Managing Hasnain Corporation & H.A. Cotton Ginners with advanced digital infrastructure.',
    image_url: 'https://images.unsplash.com/photo-1599818814474-cb72b38062a7?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);

  useEffect(() => {
    async function loadSlides() {
      const { data, error } = await supabase
        .from('slides')
        .select('id, title, body_text, image_url')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setSlides(data as Slide[]);
      }
    }
    loadSlides();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Slideshow Section */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 h-[480px] mb-12">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img src={slide.image_url ?? ''} alt={slide.title} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-12">
              <span className="inline-flex items-center gap-1 bg-emerald-500/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full w-max mb-3">
                <Sparkles size={12}/> Featured Slide {index + 1} of {slides.length}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                {slide.title}
              </h1>
              <p className="text-gray-200 text-base md:text-lg max-w-2xl mb-6">
                {slide.body_text}
              </p>
              <div className="flex items-center space-x-4">
                <Link href="/documents" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-full shadow-lg transition flex items-center gap-2">
                  Explore Documents <ArrowRight size={18}/>
                </Link>
                <Link href="/announcements" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold px-6 py-3 rounded-full transition border border-white/20">
                  View Announcements
                </Link>
              </div>
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg text-gray-800 transition"
            >
              <ChevronLeft size={20}/>
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg text-gray-800 transition"
            >
              <ChevronRight size={20}/>
            </button>
          </>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="card-3d p-8 border border-gray-100 flex flex-col items-start">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-6 shadow-inner">
            🌾
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Agricultural Commodities</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Manage cotton, wheat, and rapeseed inventories with automated enterprise reporting and storage.
          </p>
          <Link href="/documents" className="text-emerald-600 font-bold text-sm hover:underline flex items-center gap-1">
            Browse files <ArrowRight size={14}/>
          </Link>
        </div>

        <div className="card-3d p-8 border border-gray-100 flex flex-col items-start">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center text-2xl mb-6 shadow-inner">
            ⚡
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Supabase & Vercel Speed</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Instant deployment on Vercel with robust PostgreSQL database and Supabase storage buckets for media.
          </p>
          <Link href="/announcements" className="text-teal-600 font-bold text-sm hover:underline flex items-center gap-1">
            Check updates <ArrowRight size={14}/>
          </Link>
        </div>

        <div className="card-3d p-8 border border-gray-100 flex flex-col items-start">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-6 shadow-inner">
            🔒
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">OTP & Admin Control</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Secure user authentication via email OTP and full admin control panel for user statuses.
          </p>
          <Link href="/login" className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
            Login now <ArrowRight size={14}/>
          </Link>
        </div>
      </div>
    </div>
  );
}
