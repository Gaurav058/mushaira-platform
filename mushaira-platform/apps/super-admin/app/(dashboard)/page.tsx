'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, CalendarDays, Activity, ArrowRight, PlusCircle } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/shared';
import { organisersApi, eventsApi } from '@/lib/api';
import { formatDate, EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      organisersApi.getStats(),
      eventsApi.listManage({ limit: 5, page: 1 }),
    ]).then(([statsRes, eventsRes]) => {
      setStats(statsRes.data.data);
      setRecentEvents(eventsRes.data.data.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="bg-navy px-6 py-6">
        <h2 className="font-heading text-2xl font-bold text-white">Platform Dashboard</h2>
        <p className="text-white/50 text-sm mt-0.5">Mushaira — Super Admin Overview</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Organisers" value={loading ? '—' : stats?.organisers?.total ?? 0} icon={Building2} color="navy" subtext={`${stats?.organisers?.active ?? '—'} active`} />
          <StatsCard label="Total Events" value={loading ? '—' : stats?.events?.total ?? 0} icon={CalendarDays} color="gold" subtext={`${stats?.events?.live ?? '—'} live`} />
          <StatsCard label="Total Registrations" value={loading ? '—' : stats?.registrations?.total ?? 0} icon={Users} color="blue" />
          <StatsCard label="Live Now" value={loading ? '—' : stats?.events?.live ?? 0} icon={Activity} color="red" />
        </div>

        {/* Recent Events */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="font-heading text-lg font-bold text-gray-900">Recent Events</h3>
            <Link href="/events">
              <Button variant="ghost" size="sm">View all <ArrowRight size={14} /></Button>
            </Link>
          </div>
          {loading ? (
            <div className="p-6 pt-0 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Event', 'Organiser', 'Date', 'Registered', 'Status'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((ev) => (
                    <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 truncate max-w-[200px]">{ev.title}</p>
                        <p className="text-xs text-gray-400">{ev.venue}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{ev.organiser?.name ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(ev.date_time)}</td>
                      <td className="px-5 py-4"><span className="font-semibold">{ev._count?.registrations ?? 0}</span><span className="text-gray-400">/{ev.capacity}</span></td>
                      <td className="px-5 py-4"><Badge className={EVENT_STATUS_COLORS[ev.status] ?? ''}>{EVENT_STATUS_LABELS[ev.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-dashed border-navy/20 bg-navy/4 p-5 flex items-center justify-between">
            <div>
              <h4 className="font-heading font-bold text-navy">New Organiser</h4>
              <p className="text-sm text-gray-500 mt-0.5">Onboard a new event organiser</p>
            </div>
            <Link href="/organisers/new">
              <Button size="sm"><PlusCircle size={14} /> Add</Button>
            </Link>
          </div>
          <div className="rounded-2xl border border-dashed border-gold/30 bg-amber-50 p-5 flex items-center justify-between">
            <div>
              <h4 className="font-heading font-bold text-amber-700">Manage Categories</h4>
              <p className="text-sm text-gray-500 mt-0.5">Add or update ticket categories</p>
            </div>
            <Link href="/categories">
              <Button variant="gold" size="sm">Manage</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
