'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { EventForm } from '@/components/EventForm';
import { eventsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export default function NewEventPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data: res } = await eventsApi.create(data);
      toast.success('Event created successfully');
      router.push(`/events/${res.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="New Event" subtitle="Create a new event for your audience" />
      <div className="p-6 max-w-3xl">
        <EventForm
          onSubmit={handleCreate}
          loading={loading}
          submitLabel="Create Event"
        />
      </div>
    </>
  );
}
