'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Building2 } from 'lucide-react';
import { Badge, Skeleton } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { organisersApi } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function OrganisersPage() {
  const [organisers, setOrganisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrganisers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 15 };
      if (search) params['search'] = search;
      const { data } = await organisersApi.list(params);
      setOrganisers(data.data.items ?? []);
      setTotalPages(data.data.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrganisers, 300);
    return () => clearTimeout(t);
  }, [fetchOrganisers]);

  const handleToggle = async (id: string) => {
    try {
      await organisersApi.toggleStatus(id);
      toast.success('Status updated');
      fetchOrganisers();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <div className="bg-navy px-6 py-6">
        <h2 className="font-heading text-2xl font-bold text-white">Organisers</h2>
        <p className="text-white/50 text-sm mt-0.5">All registered event organisers</p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search organisers…"
              className="pl-8 pr-3 h-9 w-full rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <Link href="/organisers/new">
            <Button><PlusCircle size={15} /> New Organiser</Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : organisers.length === 0 ? (
            <div className="py-20 text-center">
              <Building2 size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No organisers found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Organisation', 'Email', 'Mobile', 'Events', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organisers.map((org) => (
                  <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{org.name}</p>
                      {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">{org.website}</a>}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{org.email}</td>
                    <td className="px-5 py-4 text-gray-600">{org.mobile}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{org._count?.events ?? 0}</td>
                    <td className="px-5 py-4">
                      <Badge className={org.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}>
                        {org.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(org.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Link href={`/organisers/${org.id}`}>
                          <Button variant="secondary" size="sm">View</Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={org.is_active ? 'danger-outline' : 'success'}
                          onClick={() => handleToggle(org.id)}
                        >
                          {org.is_active ? 'Disable' : 'Enable'}
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
