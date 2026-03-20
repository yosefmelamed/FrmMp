'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, ShieldCheck, Trash2, UserX, UserCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/auth/api';

interface User { id: string; email: string; firstName: string; lastName: string; role: 'USER'|'ADMIN'; emailVerified: boolean; active: boolean; createdAt: string; }

export default function UsersPage() {
  const { token, user: me } = useAuth();
  const [users,   setUsers]   = useState<User[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [action,  setAction]  = useState<string | null>(null); // id of user being actioned
  const LIMIT = 20;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string,string> = { page: String(page), limit: String(LIMIT) };
      if (search) params.q = search;
      const res = await adminApi.users.list(token, params);
      setUsers(res.users); setTotal(res.total);
    } finally { setLoading(false); }
  }, [token, page, search]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id: string, act: 'activate'|'deactivate'|'delete'|'makeAdmin'|'removeAdmin') => {
    if (!token) return;
    if (act === 'delete' && !confirm('Permanently delete this user?')) return;
    setAction(id);
    try {
      if (act === 'activate')    await adminApi.users.activate(token, id);
      if (act === 'deactivate')  await adminApi.users.deactivate(token, id);
      if (act === 'delete')      await adminApi.users.delete(token, id);
      if (act === 'makeAdmin')   await adminApi.users.update(token, id, { role: 'ADMIN' });
      if (act === 'removeAdmin') await adminApi.users.update(token, id, { role: 'USER' });
      await load();
    } catch (err: any) { alert(err.message); }
    finally { setAction(null); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Users</h1>
          <p className="text-sm text-zinc-400">{total} total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input type="text" placeholder="Search by name or email…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              {['Name','Email','Role','Status','Joined','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-sm">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-medium text-zinc-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-zinc-500">{u.email}
                  {!u.emailVerified && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">unverified</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full',
                    u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500')}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full',
                    u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {u.id === me?.id ? (
                    <span className="text-xs text-zinc-300">You</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {action === u.id ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : (
                        <>
                          {u.active
                            ? <button title="Deactivate" onClick={() => doAction(u.id, 'deactivate')} className="p-1.5 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"><UserX className="w-3.5 h-3.5" /></button>
                            : <button title="Activate"   onClick={() => doAction(u.id, 'activate')}   className="p-1.5 text-zinc-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"><UserCheck className="w-3.5 h-3.5" /></button>
                          }
                          {u.role === 'ADMIN'
                            ? <button title="Remove admin" onClick={() => doAction(u.id, 'removeAdmin')} className="p-1.5 text-amber-500 hover:text-zinc-600 hover:bg-zinc-50 rounded-md transition-colors"><ShieldCheck className="w-3.5 h-3.5" /></button>
                            : <button title="Make admin"   onClick={() => doAction(u.id, 'makeAdmin')}   className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"><ShieldCheck className="w-3.5 h-3.5" /></button>
                          }
                          <button title="Delete" onClick={() => doAction(u.id, 'delete')} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Page {page} of {pages}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
