import './globals.css';
import Link from 'next/link';
import { Sparkles, Home, Bell, FileText, Users, Download, Mail, User, Shield } from 'lucide-react';

export const metadata = {
  title: 'Cotton Solution - Agricultural Commodities & Portal',
  description: 'Manage Cotton, Wheat, Rapeseed, Documents & Announcements',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Airbnb Style Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-3d text-white font-bold text-xl">
                🌾
              </div>
              <div>
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Cotton Solution
                </span>
                <span className="block text-xs text-gray-500 font-medium">Enterprise & Commodities</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-gray-700">
              <Link href="/" className="hover:text-emerald-600 transition flex items-center gap-1"><Home size={16}/> Home</Link>
              <Link href="/announcements" className="hover:text-emerald-600 transition flex items-center gap-1"><Bell size={16}/> Announcements</Link>
              <Link href="/policies" className="hover:text-emerald-600 transition flex items-center gap-1"><Shield size={16}/> Policies</Link>
              <Link href="/team" className="hover:text-emerald-600 transition flex items-center gap-1"><Users size={16}/> Team</Link>
              <Link href="/documents" className="hover:text-emerald-600 transition flex items-center gap-1"><Download size={16}/> Documents</Link>
              <Link href="/contact" className="hover:text-emerald-600 transition flex items-center gap-1"><Mail size={16}/> Contact Us</Link>
            </nav>

            <div className="flex items-center space-x-3">
              <Link href="/admin/dashboard" className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-full border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm">
                <Shield size={14} className="text-emerald-600"/> Admin Panel
              </Link>
              <Link href="/login" className="flex items-center space-x-2 border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition bg-white">
                <User size={16} className="text-gray-600"/>
                <span className="text-xs font-bold text-gray-800">Login / Register</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 text-emerald-400">Cotton Solution</h3>
              <p className="text-sm text-gray-400">
                A complete digital ecosystem for cotton ginners, oil mills, agricultural commodities management, and enterprise documentation.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-300">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-white">Home Slides</Link></li>
                <li><Link href="/announcements" className="hover:text-white">Announcements & Media</Link></li>
                <li><Link href="/policies" className="hover:text-white">New Policies</Link></li>
                <li><Link href="/team" className="hover:text-white">Our Team</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-300">Services & Docs</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/documents" className="hover:text-white">PDF Document Downloads</Link></li>
                <li><Link href="/documents" className="hover:text-white">Document Generator</Link></li>
                <li><Link href="/contact" className="hover:text-white">Support & Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-300">Technology Stack</h4>
              <p className="text-sm text-gray-400">
                Built with Next.js, Tailwind CSS, Supabase Database & Storage, Resend OTP Email API, and hosted on Vercel.
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Cotton Solution. All rights reserved. Designed with Airbnb 3D UI aesthetics.
          </div>
        </footer>
      </body>
    </html>
  );
}