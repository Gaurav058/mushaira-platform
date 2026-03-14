'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Skeleton } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { usersApi } from '@/lib/api';
import { formatDate, ROLE_LABELS, ROLE_COLORS, ALL_ROLES, getErrorMessage } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (search) params['search'] = search;
      if (roleFilter) params['role'] = roleFilter;
      const { data } = await usersApi.list(params);
      setUsers(data.data.items ?? []);
      setTotalPages(data.data.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      await usersApi.changeRole(userId, role);
      toast.success(`Role changed to ${ROLE_LABELS[role]}`);
      fetchUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await usersApi.toggleStatus(userId);
      toast.success('User status updated');
      fetchUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <div className="bg-navy px-6 py-6">
        <h2 className="font-heading text-2xl font-bold text-white">Users</h2>
        <p className="text-white/50 text-sm mt-0.5">All platform users — manage roles and access</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or mobile…"
              className="pl-8 pr-3 h-9 w-full rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
          <div className="flex gap-1.5">
            {['', ...ALL_ROLES].map((r) => (
              <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  roleFilter === r ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-navy/40'
                }`}>
                {r ? ROLE_LABELS[r] : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No users found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['User', 'Mobile', 'Role', 'Registrations', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{user.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{user.email ?? ''}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-gray-600">{user.mobile_number}</td>
                    <td className="px-5 py-4">
                      <Badge className={ROLE_COLORS[user.role] ?? ''}>{ROLE_LABELS[user.role]}</Badge>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{user._count?.registrations ?? 0}</td>
                    <td className="px-5 py-4">
                      <Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className="text-xs rounded-lg border border-gray-200 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-navy"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant={user.is_active ? 'danger-outline' : 'success'}
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.is_active ? 'Suspend' : 'Reactivate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="px-3 py-1.5 text-sm text-gray-500">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
