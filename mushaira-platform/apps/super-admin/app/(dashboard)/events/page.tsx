'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Skeleton } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { eventsApi } from '@/lib/api';
import {
  formatDate,
  EVENT_STATUS_LABELS, EVENT_STATUS_COLORS,
  getErrorMessage,
} from '@/lib/utils';

const ALL_STATUSES = ['', 'DRAFT', 'PUBLISHED', 'LIVE', 'COMPLETED', 'CANCELLED'];
const FORCE_TRANSITIONS: Record<string, string[]> = {
  PUBLISHED: ['CANCELLED'],
  LIVE: ['COMPLETED', 'CANCELLED'],
};

export default function AllEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 15 };
      if (status) params['status'] = status;
      if (search) params['search'] = search;
      const { data } = await eventsApi.listManage(params);
      setEvents(data.data.items ?? []);
      setTotalPages(data.data.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const t = setTimeout(fetchEvents, 300);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await eventsApi.changeStatus(id, newStatus);
      toast.success(`Event → ${EVENT_STATUS_LABELS[newStatus]}`);
      fetchEvents();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <div className="bg-navy px-6 py-6">
        <h2 className="font-heading text-2xl font-bold text-white">All Events</h2>
        <p className="text-white/50 text-sm mt-0.5">Platform-wide event oversight</p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {ALL_STATUSES.map((s) => (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  status === s ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-navy/40'
                }`}>
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="relative w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search events…"
              className="pl-8 pr-3 h-9 w-full rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center"><p className="text-gray-400 text-sm">No events found.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Event', 'Organiser', 'Date', 'Venue', 'Registrations', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const transitions = FORCE_TRANSITIONS[ev.status] ?? [];
                  return (
                    <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="font-semibold text-gray-900 truncate">{ev.title}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{ev.organiser?.name ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(ev.date_time)}</td>
                      <td className="px-5 py-4 text-gray-500 max-w-[140px] truncate">{ev.venue}</td>
                      <td className="px-5 py-4">
                        <span className="font-semibold">{ev._count?.registrations ?? 0}</span>
                        <span className="text-gray-400">/{ev.capacity}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={EVENT_STATUS_COLORS[ev.status] ?? ''}>{EVENT_STATUS_LABELS[ev.status]}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {transitions.map((t) => (
                            <Button key={t} size="sm"
                              variant={t === 'CANCELLED' ? 'danger-outline' : 'secondary'}
                              onClick={() => handleStatusChange(ev.id, t)}>
                              {EVENT_STATUS_LABELS[t]}
                            </Button>
                          ))}
                          {transitions.length === 0 && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
