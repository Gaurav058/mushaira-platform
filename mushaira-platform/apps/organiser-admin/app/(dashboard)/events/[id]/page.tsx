'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, CheckCircle2, Clock, XCircle, ListOrdered,
  MapPin, Calendar, Edit3, PlusCircle, Trash2, DoorOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsApi, registrationsApi } from '@/lib/api';
import {
  formatDate, formatDateTime,
  EVENT_STATUS_COLORS, STATUS_LABELS,
  REG_STATUS_COLORS, REG_STATUS_LABELS,
  VALID_TRANSITIONS, getErrorMessage,
} from '@/lib/utils';

type Tab = 'overview' | 'registrations' | 'gates';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<any | null>(null);
  const [gates, setGates] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [regPage, setRegPage] = useState(1);
  const [regStatus, setRegStatus] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [newGate, setNewGate] = useState({ name: '', code: '' });
  const [addingGate, setAddingGate] = useState(false);

  const fetchEvent = useCallback(() => {
    return eventsApi.getById(id).then(({ data }) => {
      setEvent(data.data);
      setGates(data.data.gates ?? []);
    });
  }, [id]);

  const fetchRegistrations = useCallback(async () => {
    setRegLoading(true);
    try {
      const params: Record<string, unknown> = { page: regPage, limit: 20 };
      if (regStatus) params['status'] = regStatus;
      const { data } = await registrationsApi.getByEvent(id, params);
      setRegistrations(data.data.items ?? []);
      setRegTotal(data.data.total ?? 0);
    } finally {
      setRegLoading(false);
    }
  }, [id, regPage, regStatus]);

  useEffect(() => {
    fetchEvent().finally(() => setLoading(false));
  }, [fetchEvent]);

  useEffect(() => {
    if (tab === 'registrations') fetchRegistrations();
  }, [tab, fetchRegistrations]);

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus: string) => {
    try {
      await eventsApi.changeStatus(id, newStatus);
      toast.success(`Event status → ${STATUS_LABELS[newStatus]}`);
      fetchEvent();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // ── Registration approval ─────────────────────────────────────────────────
  const handleApprove = async (regId: string) => {
    try {
      await registrationsApi.approve(regId);
      toast.success('Registration approved — QR pass generated');
      fetchRegistrations();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReject = async (regId: string) => {
    try {
      await registrationsApi.reject(regId, rejectNotes[regId]);
      toast.success('Registration rejected');
      setRejectNotes((n) => { const c = { ...n }; delete c[regId]; return c; });
      fetchRegistrations();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // ── Gates ─────────────────────────────────────────────────────────────────
  const handleAddGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGate.name || !newGate.code) {
      toast.error('Gate name and code are required');
      return;
    }
    setAddingGate(true);
    try {
      await eventsApi.addGate(id, newGate);
      toast.success('Gate added');
      setNewGate({ name: '', code: '' });
      fetchEvent();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingGate(false);
    }
  };

  const handleRemoveGate = async (gateId: string) => {
    try {
      await eventsApi.removeGate(id, gateId);
      toast.success('Gate removed');
      fetchEvent();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Event" />
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </>
    );
  }

  if (!event) {
    return <div className="p-6 text-red-500">Event not found.</div>;
  }

  const transitions = VALID_TRANSITIONS[event.status] ?? [];
  const regs = event._count?.registrations ?? 0;
  const fillPct = Math.round((regs / event.capacity) * 100);

  return (
    <>
      <Header title={event.title} subtitle={`${event.organiser?.name} • ${formatDate(event.date_time)}`} />

      <div className="p-6 space-y-5">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge className={EVENT_STATUS_COLORS[event.status] ?? ''}>
              {STATUS_LABELS[event.status]}
            </Badge>
            <span className="text-sm text-gray-400">
              {regs}/{event.capacity} registered ({fillPct}%)
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/events/${id}/edit`}>
              <Button variant="secondary" size="sm">
                <Edit3 size={14} /> Edit
              </Button>
            </Link>
            {transitions.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={t === 'CANCELLED' ? 'danger-outline' : t === 'LIVE' ? 'danger' : 'outline'}
                onClick={() => handleStatusChange(t)}
              >
                → {STATUS_LABELS[t]}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['overview', 'registrations', 'gates'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
              {t === 'registrations' && regs > 0 && (
                <span className="ml-1.5 bg-primary-100 text-primary-600 text-xs rounded-full px-1.5 py-0.5">
                  {regs}
                </span>
              )}
              {t === 'gates' && gates.length > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs rounded-full px-1.5 py-0.5">
                  {gates.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard label="Total Registered" value={regs} icon={Users} color="purple" />
              <StatsCard label="Capacity" value={event.capacity} icon={Users} color="blue" />
              <StatsCard label="Approval Required" value={event.approval_required ? 'Yes' : 'No'} icon={CheckCircle2} color="gold" />
              <StatsCard label="Family Allowed" value={event.family_allowed ? 'Yes' : 'No'} icon={Users} color="green" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
              <h3 className="font-heading font-bold text-gray-900">Event Information</h3>
              <InfoRow icon={<Calendar size={15} />} label="Date & Time" value={formatDateTime(event.date_time)} />
              <InfoRow icon={<MapPin size={15} />} label="Venue" value={event.venue} />
              {event.map_link && (
                <InfoRow
                  icon={<MapPin size={15} />}
                  label="Directions"
                  value={<a href={event.map_link} target="_blank" rel="noreferrer" className="text-primary-600 underline text-sm">Open in Maps</a>}
                />
              )}
              <InfoRow icon={<Calendar size={15} />} label="Registration" value={`${formatDate(event.registration_start)} → ${formatDate(event.registration_end)}`} />
              {event.description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REGISTRATIONS TAB ────────────────────────────────────────────── */}
        {tab === 'registrations' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {['', 'PENDING', 'APPROVED', 'REJECTED', 'WAITLIST', 'CHECKED_IN'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setRegStatus(s); setRegPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    regStatus === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}
                >
                  {s || 'All'}
                  {s === 'PENDING' && (
                    <span className="ml-1 text-inherit opacity-60">(needs review)</span>
                  )}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {regLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : registrations.length === 0 ? (
                <div className="py-16 text-center">
                  <Users size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No registrations found.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Attendee', 'Category', 'Status', 'Registered', 'Actions'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {reg.user?.full_name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400">{reg.user?.mobile_number}</p>
                          {Array.isArray(reg.family_members) && reg.family_members.length > 0 && (
                            <p className="text-xs text-purple-500 mt-0.5">
                              +{reg.family_members.length} family member(s)
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {reg.category ? (
                            <span
                              className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{
                                backgroundColor: (reg.category.color ?? '#5B2C83') + '22',
                                color: reg.category.color ?? '#5B2C83',
                              }}
                            >
                              {reg.category.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={REG_STATUS_COLORS[reg.status] ?? ''}>
                            {REG_STATUS_LABELS[reg.status]}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                          {formatDate(reg.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          {reg.status === 'PENDING' ? (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex gap-1.5">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleApprove(reg.id)}
                                >
                                  <CheckCircle2 size={13} /> Approve
                                </Button>
                                <Button
                                  variant="danger-outline"
                                  size="sm"
                                  onClick={() => handleReject(reg.id)}
                                >
                                  <XCircle size={13} /> Reject
                                </Button>
                              </div>
                              <input
                                value={rejectNotes[reg.id] ?? ''}
                                onChange={(e) =>
                                  setRejectNotes((n) => ({ ...n, [reg.id]: e.target.value }))
                                }
                                placeholder="Rejection reason (optional)"
                                className="text-xs px-2 py-1 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {reg.status === 'APPROVED' && reg.qr_pass
                                ? reg.qr_pass.is_used
                                  ? '✓ Checked in'
                                  : '✓ QR issued'
                                : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {regTotal > 20 && (
              <div className="flex justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setRegPage((p) => Math.max(1, p - 1))} disabled={regPage === 1}>
                  Previous
                </Button>
                <span className="px-3 py-1.5 text-sm text-gray-500">
                  {(regPage - 1) * 20 + 1}–{Math.min(regPage * 20, regTotal)} of {regTotal}
                </span>
                <Button variant="secondary" size="sm" onClick={() => setRegPage((p) => p + 1)} disabled={regPage * 20 >= regTotal}>
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── GATES TAB ────────────────────────────────────────────────────── */}
        {tab === 'gates' && (
          <div className="space-y-4">
            {/* Add Gate Form */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="font-heading font-bold text-gray-900 mb-4">Add Gate</h3>
              <form onSubmit={handleAddGate} className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <Input
                    label="Gate Name"
                    value={newGate.name}
                    onChange={(e) => setNewGate((g) => ({ ...g, name: e.target.value }))}
                    placeholder="Main Entrance"
                  />
                </div>
                <div className="w-36">
                  <Input
                    label="Code"
                    value={newGate.code}
                    onChange={(e) => setNewGate((g) => ({ ...g, code: e.target.value.toUpperCase() }))}
                    placeholder="GATE-A"
                    maxLength={20}
                  />
                </div>
                <Button type="submit" loading={addingGate}>
                  <PlusCircle size={15} /> Add Gate
                </Button>
              </form>
            </div>

            {/* Gates List */}
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              {gates.length === 0 ? (
                <div className="py-16 text-center">
                  <DoorOpen size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No gates configured yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Gate Name', 'Code', 'Status', ''].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gates.map((gate) => (
                      <tr key={gate.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{gate.name}</td>
                        <td className="px-5 py-3">
                          <code className="bg-gray-100 text-gray-600 rounded-lg px-2 py-0.5 text-xs font-mono">
                            {gate.code}
                          </code>
                        </td>
                        <td className="px-5 py-3">
                          <Badge className={gate.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                            {gate.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveGate(gate.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function InfoRow({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium text-gray-800 mt-0.5">{value}</div>
      </div>
    </div>
  );
}
