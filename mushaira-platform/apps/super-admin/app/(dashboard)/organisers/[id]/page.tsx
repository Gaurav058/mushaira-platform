'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Copy, CheckCircle2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, Skeleton } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { organisersApi } from '@/lib/api';
import { formatDate, formatDateTime, EVENT_STATUS_COLORS, EVENT_STATUS_LABELS, getErrorMessage } from '@/lib/utils';

export default function OrganiserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    organisersApi.getById(id).then(({ data }) => setOrg(data.data)).finally(() => setLoading(false));
  }, [id]);

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success('Organiser ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async () => {
    try {
      await organisersApi.toggleStatus(id);
      toast.success('Status updated');
      const { data } = await organisersApi.getById(id);
      setOrg(data.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) {
    return (
      <div>
        <div className="bg-navy px-6 py-6"><div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" /></div>
        <div className="p-6 space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    );
  }

  if (!org) return <div className="p-6 text-red-500">Organiser not found.</div>;

  return (
    <div>
      <div className="bg-navy px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">{org.name}</h2>
            <p className="text-white/50 text-sm mt-0.5">Organiser Details</p>
          </div>
          <div className="flex gap-2">
            <Button variant={org.is_active ? 'danger-outline' : 'success'} size="sm" onClick={handleToggle}
              className={org.is_active ? 'border-white/40 text-white hover:bg-white/10' : ''}>
              {org.is_active ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-4xl">
        {/* Organiser ID (important for organiser to create events) */}
        <div className="rounded-2xl border-2 border-gold/40 bg-amber-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Organiser ID</p>
              <code className="text-sm font-mono text-gray-900 break-all">{id}</code>
              <p className="text-xs text-amber-700 mt-1.5">
                Share this ID with the organiser — required to create events in the Organiser Dashboard.
              </p>
            </div>
            <Button variant="gold" size="sm" onClick={copyId}>
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy ID'}
            </Button>
          </div>
        </div>

        {/* Info */}
        <Card className="p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Organisation Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoField label="Name" value={org.name} />
            <InfoField label="Email" value={org.email} />
            <InfoField label="Mobile" value={org.mobile} />
            <InfoField label="Website" value={org.website ?? '—'} isLink={!!org.website} href={org.website} />
            <InfoField label="Status" value={<Badge className={org.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}>{org.is_active ? 'Active' : 'Disabled'}</Badge>} />
            <InfoField label="Joined" value={formatDate(org.created_at)} />
            <div className="col-span-2">
              <InfoField label="Description" value={org.description ?? '—'} />
            </div>
          </div>
        </Card>

        {/* Recent Events */}
        {org.events?.length > 0 && (
          <Card>
            <div className="p-5 pb-3 border-b border-gray-100">
              <h3 className="font-heading font-bold text-gray-900">Recent Events ({org._count?.events ?? 0} total)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {['Title', 'Date', 'Registrations', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {org.events.map((ev: any) => (
                  <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-900">{ev.title}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(ev.date_time)}</td>
                    <td className="px-5 py-3 font-semibold">{ev._count?.registrations ?? 0}</td>
                    <td className="px-5 py-3">
                      <Badge className={EVENT_STATUS_COLORS[ev.status] ?? ''}>{EVENT_STATUS_LABELS[ev.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value, isLink, href }: { label: string; value: React.ReactNode; isLink?: boolean; href?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">{label}</p>
      {isLink && href
        ? <a href={href} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-sm">{value}</a>
        : <div className="text-sm text-gray-800">{value}</div>
      }
    </div>
  );
}
