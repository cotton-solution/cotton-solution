'use client';
import { useState } from 'react';
import { Shield, FileCheck } from 'lucide-react';

export default function PoliciesPage() {
  const [policies] = useState([
    {
      id: 1,
      title: "Commercial Lease & Factory Operating Guidelines",
      date: "Effective Jan 2026",
      content: "Detailed operational protocols for factory leases, safety standards, and environmental compliance under cotton ginning norms."
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Shield className="text-emerald-600"/> New Policies
        </h1>
        <p className="text-gray-600 mt-1">Official corporate and industrial governance policies.</p>
      </div>

      <div className="space-y-6">
        {policies.map((policy) => (
          <div key={policy.id} className="card-3d p-8 border border-gray-100 flex items-start space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <FileCheck size={28}/>
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-600">{policy.date}</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1 mb-2">{policy.title}</h2>
              <p className="text-gray-700 leading-relaxed">{policy.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}