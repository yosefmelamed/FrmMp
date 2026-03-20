'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { amenitiesApi } from '@/lib/auth/api';
import { CATEGORY_CONFIG, ALL_CATEGORIES } from '@/components/ui/CategoryBadge';

const BLANK = { name:'', category:'synagogue', address:'', lat:'', lng:'', phone:'', website:'', description:'', tags:'', active: true };

export default function AmenitiesPage() {
  const { token } = useAuth();
  const [items,   setItems]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'create'|'edit'|null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [form,    setForm]    = useState<Record<string,any>>(BLANK);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = { page: String(page), limit: String(LIMIT), active: 'all' };
    if (search) params.q = search;
    if (catFilter) params.category = catFilter;
    const res = await amenitiesApi.list(params).catch(() => ({ items: [], total: 0 }));
    setItems(res.items); setTotal(res.total); setLoading(false);
  }, [page, search, catFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(BLANK); setEditing(null); setError(''); setModal('create'); };
  const openEdit   = (a: any) => { setEditing(a); setForm({ ...a, tags: a.tags?.join(', ') ?? '', lat: String(a.lat), lng: String(a.lng) }); setError(''); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng), tags: form.tags ? form.tags.split(',').map((t:string) => t.trim()).filter(Boolean) : [] };
      if (modal === 'create') await amenitiesApi.create(token!, payload);
      else await amenitiesApi.update(token!, editing.id, payload);
      closeModal(); await load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    await amenitiesApi.delete(token!, id).catch(() => {});
    await load();
  };

  const pages = Math.ceil(total / LIMIT);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-zinc-900">Amenities</h1><p className="text-sm text-zinc-400">{total} total</p></div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Amenity
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Search…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All categories</option>
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_CONFIG[c]?.label ?? c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>{['Name','Category','Address','Status','Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-400" /></td></tr>
            : items.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">No amenities found</td></tr>
            : items.map(a => {
              const cfg = CATEGORY_CONFIG[a.category as keyof typeof CATEGORY_CONFIG];
              return (
                <tr key={a.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium text-zinc-900 max-w-[200px] truncate">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', cfg?.bg, cfg?.color)}>{cfg?.label ?? a.category}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">{a.address}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', a.active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-400')}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(a)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(a.id, a.name)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900">{modal === 'create' ? 'Add Amenity' : 'Edit Amenity'}</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              {error && <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}
              {[
                { k:'name', label:'Name*', type:'text', required: true },
                { k:'address', label:'Address*', type:'text', required: true },
                { k:'phone', label:'Phone', type:'text' },
                { k:'website', label:'Website', type:'url' },
                { k:'tags', label:'Tags (comma-separated)', type:'text' },
              ].map(({ k, label, type, required }) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">{label}</label>
                  <input type={type} value={form[k] ?? ''} onChange={set(k)} required={required}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Latitude*</label>
                  <input type="number" step="any" value={form.lat} onChange={set('lat')} required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Longitude*</label>
                  <input type="number" step="any" value={form.lng} onChange={set('lng')} required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Category*</label>
                <select value={form.category} onChange={set('category')} required
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_CONFIG[c]?.label ?? c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Description</label>
                <textarea value={form.description ?? ''} onChange={set('description') as any} rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(v => ({ ...v, active: e.target.checked }))} className="rounded" />
                <label htmlFor="active" className="text-sm text-zinc-600">Active (visible on map)</label>
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
