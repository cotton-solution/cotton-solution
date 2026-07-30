'use client';
import { useState, useEffect } from 'react';
import { Bell, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Announcement = {
  id: string;
  title: string;
  content: string | null;
  images: string[] | null;
  videos: string[] | null;
  created_at: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setAnnouncements(data as Announcement[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Bell className="text-emerald-600"/> Announcements & Media
        </h1>
        <p className="text-gray-600 mt-1">Latest updates, multimedia notices, and corporate circulars.</p>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading announcements...</p>}
      {!loading && announcements.length === 0 && (
        <p className="text-gray-500 text-sm">No announcements yet.</p>
      )}

      <div className="space-y-8">
        {announcements.map((item) => (
          <div key={item.id} className="card-3d p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                <Calendar size={12}/> {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h2>
            <p className="text-gray-700 leading-relaxed mb-6">{item.content}</p>

            {item.images && item.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {item.images.map((img, idx) => (
                  <img key={idx} src={img} alt="Announcement Media" className="rounded-xl object-cover h-64 w-full shadow-md" />
                ))}
              </div>
            )}

            {item.videos && item.videos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.videos.map((vid, idx) => (
                  <video key={idx} src={vid} controls className="rounded-xl w-full h-64 object-cover shadow-md" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
