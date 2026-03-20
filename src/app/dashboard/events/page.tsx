'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { eventsApi } from '@/lib/auth/api';

const BLANK = { title:'', description:'', date:'', time:'', location:'', category:'Shabbat', imageUrl:'', active:true };

export default function EventsPage() {
  const { token } = useAuth();
  const [items,   setItems]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'create'|'edit'|null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [form,    setForm]    = useState<Record<string,any>>(BLANK);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = { page: String(page), limit: String(LIMIT) };
    if (search) params.q = search;
    const res = await eventsApi.list(params).catch(() => ({ items: [], total: 0 }));
    setItems(res.items); setTotal(res.total); setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(BLANK); setEditing(null); setError(''); setModal('create'); };
  const openEdit   = (ev: any) => {
    const d = new Date(ev.date);
    setEditing(ev);
    setForm({ ...ev, date: d.toISOString().slice(0,16) });
    setError(''); setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, date: new Date(form.date).toISOString() };
      if (modal === 'create') await eventsApi.create(token!, payload);
      else await eventsApi.update(token!, editing.id, payload);
      closeModal(); await load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this event?')) return;
    await eventsApi.delete(token!, id).catch(() => {});
    await load();
  };

  const pages = Math.ceil(total / LIMIT);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-zinc-900">Events</h1><p className="text-sm text-zinc-400">{total} total</p></div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input type="text" placeholder="Search…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>{['Title','Date','Location','Category','Status','Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-400" /></td></tr>
            : items.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">No events found</td></tr>
            : items.map(ev => (
              <tr key={ev.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-medium text-zinc-900 max-w-[180px] truncate">{ev.title}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(ev.date).toLocaleDateString()} {ev.time}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs max-w-[150px] truncate">{ev.location}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">{ev.category}</span></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>{ev.active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(ev)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Page {page} of {pages}</span>
            <div className="flex gap-1">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 disabled:opacity-30"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page===pages} onClick={() => setPage(p=>p+1)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 disabled:opacity-30"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900">{modal === 'create' ? 'Add Event' : 'Edit Event'}</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              {error && <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}
              {[
                { k:'title',    label:'Title*',    type:'text', required:true },
                { k:'location', label:'Location*', type:'text', required:true },
                { k:'time',     label:'Time*',     type:'text', required:true, placeholder:'7:00 PM' },
                { k:'category', label:'Category*', type:'text', required:true },
                { k:'imageUrl', label:'Image URL', type:'url' },
              ].map(({ k, label, type, required, placeholder }) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">{label}</label>
                  <input type={type} value={form[k] ?? ''} onChange={set(k)} required={required} placeholder={placeholder}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Date & Time*</label>
                <input type="datetime-local" value={form.date} onChange={set('date')} required
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Description*</label>
                <textarea value={form.description ?? ''} onChange={set('description') as any} rows={3} required
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="evActive" checked={form.active} onChange={e => setForm(v => ({ ...v, active: e.target.checked }))} className="rounded" />
                <label htmlFor="evActive" className="text-sm text-zinc-600">Active</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2 border border-zinc-200 text-sm text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
