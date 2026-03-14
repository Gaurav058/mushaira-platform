'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsApi } from '@/lib/api';
import {
  formatDate,
  EVENT_STATUS_COLORS,
  STATUS_LABELS,
  VALID_TRANSITIONS,
  getErrorMessage,
} from '@/lib/utils';
import toast from 'react-hot-toast';

const ALL_STATUSES = ['', 'DRAFT', 'PUBLISHED', 'LIVE', 'COMPLETED', 'CANCELLED'];

export default function EventsPage() {
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

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await eventsApi.changeStatus(eventId, newStatus);
      toast.success(`Event status changed to ${STATUS_LABELS[newStatus]}`);
      fetchEvents();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <Header title="Events" subtitle="Manage all your events" />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  status === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search events…"
                className="pl-8 pr-3 h-9 w-full rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Link href="/events/new">
              <Button size="md">
                <PlusCircle size={15} /> New Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">No events found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Event', 'Date', 'Venue', 'Registrations', 'Status', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const transitions = VALID_TRANSITIONS[event.status] ?? [];
                  return (
                    <tr
                      key={event.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="font-semibold text-gray-900 truncate">
                          {event.title}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(event.date_time)}
                      </td>
                      <td className="px-5 py-4 text-gray-500 max-w-[160px] truncate">
                        {event.venue}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900">
                          {event._count?.registrations ?? 0}
                        </span>
                        <span className="text-gray-400">/{event.capacity}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          className={EVENT_STATUS_COLORS[event.status] ?? ''}
                        >
                          {STATUS_LABELS[event.status]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          <Link href={`/events/${event.id}`}>
                            <Button variant="secondary" size="sm">
                              Manage
                            </Button>
                          </Link>
                          {transitions.map((t) => (
                            <Button
                              key={t}
                              size="sm"
                              variant={
                                t === 'CANCELLED'
                                  ? 'danger-outline'
                                  : t === 'LIVE'
                                  ? 'danger'
                                  : 'outline'
                              }
                              onClick={() => handleStatusChange(event.id, t)}
                            >
                              {STATUS_LABELS[t]}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1.5 text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
