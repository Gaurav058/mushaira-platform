'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toDateTimeLocal, getErrorMessage } from '@/lib/utils';

export interface EventFormData {
  organiser_id: string;
  title: string;
  subtitle: string;
  venue: string;
  date_time: string;
  registration_start: string;
  registration_end: string;
  capacity: string;
  description: string;
  map_link: string;
  poster: string;
  approval_required: boolean;
  family_allowed: boolean;
}

const defaultForm: EventFormData = {
  organiser_id: '',
  title: '',
  subtitle: '',
  venue: '',
  date_time: '',
  registration_start: '',
  registration_end: '',
  capacity: '',
  description: '',
  map_link: '',
  poster: '',
  approval_required: true,
  family_allowed: true,
};

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
  submitLabel?: string;
}

export function EventForm({
  initialData,
  onSubmit,
  loading,
  submitLabel = 'Save Event',
}: EventFormProps) {
  const [form, setForm] = useState<EventFormData>({
    ...defaultForm,
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  // Remember organiser_id in localStorage
  useEffect(() => {
    if (!form.organiser_id) {
      const saved = localStorage.getItem('mushaira_organiser_id');
      if (saved) setForm((f) => ({ ...f, organiser_id: saved }));
    }
  }, []);

  const set = (key: keyof EventFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof EventFormData, string>> = {};
    if (!form.organiser_id.trim()) errs.organiser_id = 'Required';
    if (!form.title.trim()) errs.title = 'Required';
    if (!form.venue.trim()) errs.venue = 'Required';
    if (!form.date_time) errs.date_time = 'Required';
    if (!form.registration_start) errs.registration_start = 'Required';
    if (!form.registration_end) errs.registration_end = 'Required';
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1)
      errs.capacity = 'Must be a positive number';
    if (form.registration_start && form.registration_end) {
      if (new Date(form.registration_start) >= new Date(form.registration_end))
        errs.registration_end = 'Must be after registration start';
    }
    if (form.registration_end && form.date_time) {
      if (new Date(form.registration_end) >= new Date(form.date_time))
        errs.date_time = 'Event must be after registration closes';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Save organiser_id for next time
    localStorage.setItem('mushaira_organiser_id', form.organiser_id);

    await onSubmit({
      organiser_id: form.organiser_id,
      title: form.title,
      subtitle: form.subtitle || undefined,
      venue: form.venue,
      date_time: new Date(form.date_time).toISOString(),
      registration_start: new Date(form.registration_start).toISOString(),
      registration_end: new Date(form.registration_end).toISOString(),
      capacity: Number(form.capacity),
      description: form.description || undefined,
      map_link: form.map_link || undefined,
      poster: form.poster || undefined,
      approval_required: form.approval_required,
      family_allowed: form.family_allowed,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organiser */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <Input
          label="Organiser ID *"
          value={form.organiser_id}
          onChange={set('organiser_id')}
          placeholder="Enter your Organiser UUID"
          error={errors.organiser_id}
          hint="Your unique organiser UUID — ask your Super Admin if unsure. Saved locally after first use."
        />
      </div>

      {/* Basic Info */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <h3 className="font-heading font-bold text-gray-900">Event Details</h3>
        <Input
          label="Event Title *"
          value={form.title}
          onChange={set('title')}
          placeholder="Annual Poetry Night 2025"
          error={errors.title}
        />
        <Input
          label="Subtitle"
          value={form.subtitle}
          onChange={set('subtitle')}
          placeholder="A celebration of classical poetry and literary arts"
        />
        <Input
          label="Venue *"
          value={form.venue}
          onChange={set('venue')}
          placeholder="Siri Fort Auditorium, New Delhi"
          error={errors.venue}
        />
        <Input
          label="Google Maps Link"
          value={form.map_link}
          onChange={set('map_link')}
          placeholder="https://maps.google.com/?q=..."
          type="url"
        />
        <Input
          label="Poster Image URL"
          value={form.poster}
          onChange={set('poster')}
          placeholder="https://cdn.example.com/poster.jpg"
          type="url"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={set('description')}
          placeholder="A grand evening celebrating classical poetry, music, and literary arts..."
          rows={4}
        />
      </section>

      {/* Dates & Capacity */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <h3 className="font-heading font-bold text-gray-900">Schedule & Capacity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Event Date & Time *"
            value={form.date_time}
            onChange={set('date_time')}
            type="datetime-local"
            error={errors.date_time}
          />
          <Input
            label="Total Capacity *"
            value={form.capacity}
            onChange={set('capacity')}
            type="number"
            min={1}
            placeholder="500"
            error={errors.capacity}
          />
          <Input
            label="Registration Opens *"
            value={form.registration_start}
            onChange={set('registration_start')}
            type="datetime-local"
            error={errors.registration_start}
          />
          <Input
            label="Registration Closes *"
            value={form.registration_end}
            onChange={set('registration_end')}
            type="datetime-local"
            error={errors.registration_end}
          />
        </div>
      </section>

      {/* Settings */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
        <h3 className="font-heading font-bold text-gray-900">Settings</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.approval_required}
            onChange={(e) =>
              setForm((f) => ({ ...f, approval_required: e.target.checked }))
            }
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Require organiser approval
            </span>
            <p className="text-xs text-gray-400">
              Registrations will be pending until you manually approve each one.
            </p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.family_allowed}
            onChange={(e) =>
              setForm((f) => ({ ...f, family_allowed: e.target.checked }))
            }
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Allow family member registration
            </span>
            <p className="text-xs text-gray-400">
              Attendees can include family members in their registration.
            </p>
          </div>
        </label>
      </section>

      <Button type="submit" loading={loading} size="lg" className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
