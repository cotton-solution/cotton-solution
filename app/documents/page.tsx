'use client';
import { useState, useEffect } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Doc = {
  id: string;
  name: string;
  detail: string | null;
  file_url: string | null;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const [genTitle, setGenTitle] = useState("");
  const [genDetails, setGenDetails] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setDocuments(data as Doc[]);
      setLoading(false);
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <FileText className="text-emerald-600"/> Documents Center
        </h1>
        <p className="text-gray-600 mt-1">Download verified corporate PDF documents or generate custom professional letters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Document Download Section */}
        <div className="card-3d p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Download className="text-emerald-600" size={20}/> Download PDF Documents
          </h2>

          {loading && <p className="text-gray-500 text-sm">Loading documents...</p>}
          {!loading && documents.length === 0 && (
            <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
          )}

          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between hover:bg-emerald-50/50 transition">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{doc.name}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{doc.detail}</p>
                </div>
                <a
                  href={doc.file_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 shadow-md transition flex items-center gap-1 text-xs font-bold"
                >
                  <Download size={14}/> Download
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Document Section (local, no DB needed) */}
        <div className="card-3d p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Printer className="text-emerald-600" size={20}/> Generate Custom Document
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Document Title</label>
              <input
                type="text"
                value={genTitle}
                onChange={(e) => setGenTitle(e.target.value)}
                placeholder="e.g. Official Corporate Authorization Letter"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Document Details / Body</label>
              <textarea
                rows={4}
                value={genDetails}
                onChange={(e) => setGenDetails(e.target.value)}
                placeholder="Enter document text, terms, or declaration details..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <button
              onClick={handlePrint}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Printer size={16}/> Print / Export to PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
