'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsApi } from '@/lib/api';
import {
  formatDate,
  EVENT_STATUS_COLORS,
  STATUS_LABELS,
} from '@/lib/utils';

export default function DashboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi
      .listManage({ limit: 6 })
      .then(({ data }) => setEvents(data.data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalCapacity = events.reduce((s, e) => s + (e.capacity ?? 0), 0);
  const totalRegistrations = events.reduce(
    (s, e) => s + (e._count?.registrations ?? 0),
    0,
  );
  const liveEvents = events.filter((e) => e.status === 'LIVE').length;
  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED').length;

  return (
    <>
      <Header title="Dashboard" subtitle="Welcome back to your organiser panel" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Events"
            value={loading ? '—' : events.length}
            icon={CalendarDays}
            color="purple"
          />
          <StatsCard
            label="Live Now"
            value={loading ? '—' : liveEvents}
            icon={CheckCircle2}
            color="red"
          />
          <StatsCard
            label="Published"
            value={loading ? '—' : publishedEvents}
            icon={CalendarDays}
            color="green"
          />
          <StatsCard
            label="Total Registrations"
            value={loading ? '—' : totalRegistrations}
            icon={Users}
            color="blue"
            subtext={`across ${events.length} events`}
          />
        </div>

        {/* Recent Events */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="font-heading text-lg font-bold text-gray-900">
              Recent Events
            </h3>
            <Link href="/events">
              <Button variant="ghost" size="sm">
                View all <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="p-6 pt-0 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-6 pt-0 text-center py-12">
              <CalendarDays
                size={40}
                className="text-gray-300 mx-auto mb-3"
              />
              <p className="text-gray-500 text-sm">No events yet.</p>
              <Link href="/events/new" className="mt-3 inline-block">
                <Button size="sm">
                  <PlusCircle size={14} /> Create your first event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 pb-3">
                      Event
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 pb-3">
                      Date
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 pb-3">
                      Registrations
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 pb-3">
                      Status
                    </th>
                    <th className="px-6 pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.venue}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(event.date_time)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {event._count?.registrations ?? 0}
                        </span>
                        <span className="text-gray-400">
                          /{event.capacity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            EVENT_STATUS_COLORS[event.status] ??
                            'bg-gray-100 text-gray-600'
                          }
                        >
                          {STATUS_LABELS[event.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/events/${event.id}`}>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-primary-600">
              Ready to host an event?
            </h3>
            <p className="text-sm text-primary-400 mt-0.5">
              Create a new event and start accepting registrations.
            </p>
          </div>
          <Link href="/events/new">
            <Button>
              <PlusCircle size={16} /> New Event
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
