'use client';
import { useState } from 'react';
import { Bell, Video, Image as ImageIcon, Calendar } from 'lucide-react';

export default function AnnouncementsPage() {
  const [announcements] = useState([
    {
      id: 1,
      title: "New Season Cotton Procurement Policy Announced",
      date: "July 28, 2026",
      content: "All commission shops and ginning units must adhere to the updated quality guidelines for cotton and rapeseed arrivals.",
      images: ["https://images.unsplash.com/photo-1599818814474-cb72b38062a7?auto=format&fit=crop&w=800&q=80"],
      videos: []
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Bell className="text-emerald-600"/> Announcements & Media
        </h1>
        <p className="text-gray-600 mt-1">Latest updates, multimedia notices, and corporate circulars.</p>
      </div>

      <div className="space-y-8">
        {announcements.map((item) => (
          <div key={item.id} className="card-3d p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                <Calendar size={12}/> {item.date}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h2>
            <p className="text-gray-700 leading-relaxed mb-6">{item.content}</p>

            {item.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {item.images.map((img, idx) => (
                  <img key={idx} src={img} alt="Announcement Media" className="rounded-xl object-cover h-64 w-full shadow-md" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}