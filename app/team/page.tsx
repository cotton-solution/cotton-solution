'use client';
import { useState, useEffect } from 'react';
import { Users, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  image_url: string | null;
  email: string | null;
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) setTeam(data as TeamMember[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Users className="text-emerald-600"/> Team Members
        </h1>
        <p className="text-gray-600 mt-1">Key leadership and management personnel.</p>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading team...</p>}
      {!loading && team.length === 0 && (
        <p className="text-gray-500 text-sm">No team members added yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {team.map((member) => (
          <div key={member.id} className="card-3d p-6 border border-gray-100 text-center flex flex-col items-center">
            <img src={member.image_url ?? ''} alt={member.name} className="w-28 h-28 rounded-full object-cover mb-4 shadow-md border-4 border-white" />
            <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
            <p className="text-emerald-600 text-sm font-semibold mb-4">{member.role}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-full w-full justify-center">
              <Mail size={14}/> {member.email}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
