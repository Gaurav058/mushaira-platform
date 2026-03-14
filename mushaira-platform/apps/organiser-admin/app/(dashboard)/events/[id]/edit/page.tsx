'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { EventForm } from '@/components/EventForm';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsApi } from '@/lib/api';
import { getErrorMessage, toDateTimeLocal } from '@/lib/utils';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    eventsApi
      .getById(id)
      .then(({ data }) => setEvent(data.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      await eventsApi.update(id, data);
      toast.success('Event updated successfully');
      router.push(`/events/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Edit Event" />
        <div className="p-6 max-w-3xl space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <p className="text-red-500">Event not found.</p>
      </div>
    );
  }

  return (
    <>
      <Header title="Edit Event" subtitle={event.title} />
      <div className="p-6 max-w-3xl">
        <EventForm
          initialData={{
            organiser_id: event.organiser_id,
            title: event.title,
            subtitle: event.subtitle ?? '',
            venue: event.venue,
            date_time: toDateTimeLocal(event.date_time),
            registration_start: toDateTimeLocal(event.registration_start),
            registration_end: toDateTimeLocal(event.registration_end),
            capacity: String(event.capacity),
            description: event.description ?? '',
            map_link: event.map_link ?? '',
            poster: event.poster ?? '',
            approval_required: event.approval_required,
            family_allowed: event.family_allowed,
          }}
          onSubmit={handleUpdate}
          loading={saving}
          submitLabel="Save Changes"
        />
      </div>
    </>
  );
}
