'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { organisersApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export default function NewOrganiserPage() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', website: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs['name'] = 'Required';
    if (!form.email.trim()) errs['email'] = 'Required';
    if (!form.mobile.trim()) errs['mobile'] = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await organisersApi.create({
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        website: form.website || undefined,
        description: form.description || undefined,
      });
      toast.success('Organiser created successfully');
      router.push('/organisers');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-navy px-6 py-6">
        <h2 className="font-heading text-2xl font-bold text-white">New Organiser</h2>
        <p className="text-white/50 text-sm mt-0.5">Register a new event organiser on the platform</p>
      </div>

      <div className="p-6 max-w-2xl">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Organisation Name *" value={form.name} onChange={set('name')} placeholder="Jashn-e-Urdu" error={errors['name']} />
              <Input label="Email *" value={form.email} onChange={set('email')} placeholder="admin@org.com" type="email" error={errors['email']} />
              <Input label="Mobile *" value={form.mobile} onChange={set('mobile')} placeholder="+919000000000" type="tel" error={errors['mobile']} />
              <Input label="Website" value={form.website} onChange={set('website')} placeholder="https://example.org" type="url" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Brief description of the organisation…"
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading} size="lg">Create Organiser</Button>
              <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>After creating:</strong> Share the Organiser ID from the detail page with the organiser. They will need it when creating events in the Organiser Dashboard.
        </div>
      </div>
    </div>
  );
}
