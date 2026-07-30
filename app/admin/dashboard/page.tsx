'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Upload, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  role: string;
};

type Doc = { id: string; name: string; detail: string | null; file_url: string | null };
type Slide = { id: string; title: string; body_text: string | null; image_url: string | null; sort_order: number };
type Announcement = { id: string; title: string; content: string | null; images: string[]; videos: string[] };

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ---- Auth guard ----
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }
      setIsAdmin(true);
      setCheckingAuth(false);
    }
    checkAdmin();
  }, [router]);

  // ---- Users ----
  const [users, setUsers] = useState<Profile[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data) setUsers(data as Profile[]);
    });
  }, [isAdmin]);

  const updateUserStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (!error) setUsers(users.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  // ---- Documents ----
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [docName, setDocName] = useState('');
  const [docDetail, setDocDetail] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('documents').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setDocuments(data as Doc[]);
    });
  }, [isAdmin]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docFile) return alert('Please choose a PDF file.');
    setUploading(true);

    const filePath = `${Date.now()}-${docFile.name}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, docFile);
    if (uploadError) {
      setUploading(false);
      alert('Upload failed: ' + uploadError.message);
      return;
    }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('documents')
      .insert({ name: docName, detail: docDetail, file_url: urlData.publicUrl })
      .select()
      .single();

    setUploading(false);
    if (error) return alert('Save failed: ' + error.message);

    setDocuments([data as Doc, ...documents]);
    setDocName('');
    setDocDetail('');
    setDocFile(null);
  };

  const deleteDocument = async (id: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) setDocuments(documents.filter((d) => d.id !== id));
  };

  // ---- Slides ----
  const [slides, setSlides] = useState<Slide[]>([]);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideText, setSlideText] = useState('');
  const [slideImage, setSlideImage] = useState<File | null>(null);
  const [uploadingSlide, setUploadingSlide] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('slides').select('*').order('sort_order').then(({ data }) => {
      if (data) setSlides(data as Slide[]);
    });
  }, [isAdmin]);

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideTitle || !slideImage) return alert('Please add a title and image.');
    setUploadingSlide(true);

    const filePath = `slides/${Date.now()}-${slideImage.name}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, slideImage);
    if (uploadError) {
      setUploadingSlide(false);
      alert('Upload failed: ' + uploadError.message);
      return;
    }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('slides')
      .insert({ title: slideTitle, body_text: slideText, image_url: urlData.publicUrl, sort_order: slides.length })
      .select()
      .single();

    setUploadingSlide(false);
    if (error) return alert('Save failed: ' + error.message);

    setSlides([...slides, data as Slide]);
    setSlideTitle('');
    setSlideText('');
    setSlideImage(null);
  };

  const deleteSlide = async (id: string) => {
    const { error } = await supabase.from('slides').delete().eq('id', id);
    if (!error) setSlides(slides.filter((s) => s.id !== id));
  };

  // ---- Announcements ----
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annImages, setAnnImages] = useState<FileList | null>(null);
  const [uploadingAnn, setUploadingAnn] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setAnnouncements(data as Announcement[]);
    });
  }, [isAdmin]);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle) return alert('Please add a title.');
    setUploadingAnn(true);

    const imageUrls: string[] = [];
    if (annImages) {
      for (const file of Array.from(annImages)) {
        const filePath = `announcements/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
          imageUrls.push(urlData.publicUrl);
        }
      }
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({ title: annTitle, content: annContent, images: imageUrls, videos: [] })
      .select()
      .single();

    setUploadingAnn(false);
    if (error) return alert('Save failed: ' + error.message);

    setAnnouncements([data as Announcement, ...announcements]);
    setAnnTitle('');
    setAnnContent('');
    setAnnImages(null);
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) setAnnouncements(announcements.filter((a) => a.id !== id));
  };

  if (checkingAuth) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">Checking access...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="text-emerald-600"/> Admin Control Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage users, documents, slides, and announcements.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 mb-8 overflow-x-auto">
        {['users', 'documents', 'slides', 'announcements'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-bold text-sm border-b-2 whitespace-nowrap capitalize ${
              activeTab === tab ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'users' ? 'Users Management' : tab === 'documents' ? 'Upload Documents' : tab === 'slides' ? 'Home Slides' : 'Announcements'}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-gray-500 text-sm py-6">No users yet.</p>}
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-3d p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Upload size={18} className="text-emerald-600"/> Upload PDF Document
            </h2>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Document Name</label>
                <input type="text" required value={docName} onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Annual Tax Audit Report" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Detail / Description</label>
                <textarea rows={3} required value={docDetail} onChange={(e) => setDocDetail(e.target.value)}
                  placeholder="Enter document description..." className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Upload PDF File</label>
                <input type="file" accept=".pdf" required onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg transition text-sm">
                {uploading ? 'Uploading...' : 'Upload Document'}
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
                    <a href={doc.file_url ?? '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">View</a>
                    <button onClick={() => deleteDocument(doc.id)} className="p-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && <p className="text-gray-500 text-sm">No documents uploaded yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* SLIDES TAB */}
      {activeTab === 'slides' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-3d p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-emerald-600"/> Add New Slide
            </h2>
            <form onSubmit={handleAddSlide} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Slide Title</label>
                <input type="text" required value={slideTitle} onChange={(e) => setSlideTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Short Text</label>
                <textarea rows={3} value={slideText} onChange={(e) => setSlideText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Slide Image</label>
                <input type="file" accept="image/*" required onChange={(e) => setSlideImage(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
              <button type="submit" disabled={uploadingSlide} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg transition text-sm">
                {uploadingSlide ? 'Uploading...' : 'Add Slide'}
              </button>
            </form>
          </div>

          <div className="card-3d p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Home Slides</h2>
            <div className="space-y-3">
              {slides.map((slide) => (
                <div key={slide.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {slide.image_url && <img src={slide.image_url} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                    <h3 className="font-bold text-sm text-gray-900">{slide.title}</h3>
                  </div>
                  <button onClick={() => deleteSlide(slide.id)} className="p-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold"><Trash2 size={14}/></button>
                </div>
              ))}
              {slides.length === 0 && <p className="text-gray-500 text-sm">No slides added yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-3d p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-emerald-600"/> Add New Announcement
            </h2>
            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title</label>
                <input type="text" required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Content</label>
                <textarea rows={3} value={annContent} onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Images (multiple allowed)</label>
                <input type="file" accept="image/*" multiple onChange={(e) => setAnnImages(e.target.files)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
              <button type="submit" disabled={uploadingAnn} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg transition text-sm">
                {uploadingAnn ? 'Uploading...' : 'Add Announcement'}
              </button>
            </form>
          </div>

          <div className="card-3d p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Announcements</h2>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900">{a.title}</h3>
                  <button onClick={() => deleteAnnouncement(a.id)} className="p-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold"><Trash2 size={14}/></button>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-gray-500 text-sm">No announcements added yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
