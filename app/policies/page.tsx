'use client';
import { useState, useEffect } from 'react';
import { Shield, FileCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Policy = {
  id: string;
  title: string;
  content: string | null;
  effective_date: string | null;
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setPolicies(data as Policy[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Shield className="text-emerald-600"/> New Policies
        </h1>
        <p className="text-gray-600 mt-1">Official corporate and industrial governance policies.</p>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading policies...</p>}
      {!loading && policies.length === 0 && (
        <p className="text-gray-500 text-sm">No policies published yet.</p>
      )}

      <div className="space-y-6">
        {policies.map((policy) => (
          <div key={policy.id} className="card-3d p-8 border border-gray-100 flex items-start space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <FileCheck size={28}/>
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-600">{policy.effective_date}</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1 mb-2">{policy.title}</h2>
              <p className="text-gray-700 leading-relaxed">{policy.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
