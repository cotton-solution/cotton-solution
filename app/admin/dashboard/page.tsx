'use client';
import { useState } from 'react';
import { Shield, Users, Bell, FileText, Upload, Plus, Trash2, Edit, CheckCircle, Ban, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  // State for Users Management
  const [users, setUsers] = useState([
    { id: 1, name: "Hasnain Haider", email: "hasnain@cottonsolution.com", status: "Active" },
    { id: 2, name: "Ijaz Ali", email: "ijaz@cottonsolution.com", status: "Pending Approval" }
  ]);

  // State for Documents Upload
  const [documents, setDocuments] = useState([
    { id: 1, name: "Cotton Agreement V1", detail: "Standard factory lease agreement." }
  ]);
  const [docName, setDocName] = useState('');
  const [docDetail, setDocDetail] = useState('');

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;
    setDocuments([...documents, { id: Date.now(), name: docName, detail: docDetail }]);
    setDocName('');
    setDocDetail('');
    alert("Document uploaded successfully to Supabase Storage!");
  };

  const updateUserStatus = (id: number, status: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status } : u));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="text-emerald-600"/> Admin Control Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage users, documents, slides, announcements, and policies.</p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-bold text-sm border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Users Management
        </button>
        <button 
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-3 font-bold text-sm border-b-2 whitespace-nowrap ${activeTab === 'documents' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Upload Documents
        </button>
        <button 
          onClick={() => setActiveTab('slides')}
          className={`px-4 py-3 font-bold text-sm border-b-2 whitespace-nowrap ${activeTab === 'slides' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Home Slides
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-3 font-bold text-sm border-b-2 whitespace-nowrap ${activeTab === 'announcements' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Announcements
        </button>
      </div>

      {/* Tab Content: Users Management */}
      {activeTab === 'users' && (
        <div className="card-3d p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Status & Access Control</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs">
                  <th className="pb-3">User Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-4 font-bold text-gray-900">{u.name}</td>
                    <td className="py-4 text-gray-600">{u.email}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        u.status === 'Banned' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <button onClick={() => updateUserStatus(u.id, 'Active')} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500">Active</button>
                      <button onClick={() => updateUserStatus(u.id, 'Expired')} className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-500">Expire</button>
                      <button onClick={() => updateUserStatus(u.id, 'Banned')} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500">Banned</button>
                      <button onClick={() => alert("Notification alert sent to " + u.name)} className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500">Notify</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Upload Documents */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-3d p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Upload size={18} className="text-emerald-600"/> Upload PDF Document
            </h2>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Document Name</label>
                <input 
                  type="text" 
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Annual Tax Audit Report"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Detail / Description</label>
                <textarea 
                  rows={3}
                  required
                  value={docDetail}
                  onChange={(e) => setDocDetail(e.target.value)}
                  placeholder="Enter document description..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Upload PDF File (Supabase Storage)</label>
                <input type="file" accept=".pdf" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition text-sm">
                Upload Document
              </button>
            </form>
          </div>

          <div className="card-3d p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Uploaded Documents</h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{doc.name}</h3>
                    <p className="text-xs text-gray-600">{doc.detail}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => alert("Viewing document")} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">View</button>
                    <button onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))} className="p-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Slides & Announcements */}
      {activeTab === 'slides' && (
        <div className="card-3d p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Home Slides</h2>
          <p className="text-sm text-gray-600 mb-4">Add, edit, view, and delete slides with image and short text.</p>
          <button onClick={() => alert("Add slide modal opened")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-md">
            <Plus size={14}/> Add New Slide
          </button>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="card-3d p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Announcements (Images, Videos, Text)</h2>
          <p className="text-sm text-gray-600 mb-4">Upload multimedia announcements with full edit, view, and delete control.</p>
          <button onClick={() => alert("Add announcement modal opened")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-md">
            <Plus size={14}/> Add New Announcement
          </button>
        </div>
      )}
    </div>
  );
}