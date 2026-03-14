'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Pencil, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Skeleton } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categoriesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

const PRESET_COLORS = [
  '#5B2C83', '#D4AF37', '#C0392B', '#27AE60',
  '#2980B9', '#E67E22', '#8E44AD', '#16A085',
];

interface CategoryForm { name: string; description: string; color: string }
const emptyForm: CategoryForm = { name: '', description: '', color: '#5B2C83' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchCategories = () =>
    categoriesApi.list().then(({ data }) => setCategories(data.data ?? [])).finally(() => setLoading(false));

  useEffect(() => { fetchCategories(); }, []);

  const startEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description ?? '', color: cat.color ?? '#5B2C83' });
    setShowForm(true);
  };

  const cancelForm = () => { setEditId(null); setForm(emptyForm); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await categoriesApi.update(editId, form);
        toast.success('Category updated');
      } else {
        await categoriesApi.create({ id: form.name.toLowerCase().replace(/\s+/g, '-'), ...form });
        toast.success('Category created');
      }
      cancelForm();
      fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? This may affect existing registrations.`)) return;
    try {
      await categoriesApi.remove(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <div className="bg-navy px-6 py-6">
        <h2 className="font-heading text-2xl font-bold text-white">Categories</h2>
        <p className="text-white/50 text-sm mt-0.5">Platform-wide registration ticket categories</p>
      </div>

      <div className="p-6 space-y-5 max-w-3xl">
        {/* Form */}
        {showForm ? (
          <Card className="p-6">
            <h3 className="font-heading font-bold text-gray-900 mb-4">
              {editId ? 'Edit Category' : 'New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="General" disabled={!!editId} hint={editId ? 'Category ID cannot be changed' : undefined} />
                <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Standard entry" />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Color</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: form.color === c ? '#1A1A2E' : 'transparent' }}
                    />
                  ))}
                  <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-8 h-8 rounded-full cursor-pointer border border-gray-200" title="Custom colour" />
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: form.color }} />
                <span className="text-sm font-semibold" style={{ color: form.color }}>{form.name || 'Category Name'}</span>
                <span className="text-sm text-gray-500">{form.description || 'Description'}</span>
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={saving}>{editId ? 'Save Changes' : 'Create Category'}</Button>
                <Button type="button" variant="secondary" onClick={cancelForm}>Cancel</Button>
              </div>
            </form>
          </Card>
        ) : (
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle size={16} /> New Category
          </Button>
        )}

        {/* List */}
        <Card>
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center">
              <Tag size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No categories yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['', 'Name', 'Description', 'ID', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4 w-8">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color ?? '#ccc' }} />
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900" style={{ color: cat.color }}>{cat.name}</td>
                    <td className="px-5 py-4 text-gray-500">{cat.description ?? '—'}</td>
                    <td className="px-5 py-4">
                      <code className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{cat.id}</code>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <Button variant="secondary" size="sm" onClick={() => startEdit(cat)}>
                          <Pencil size={13} />
                        </Button>
                        <Button variant="danger-outline" size="sm" onClick={() => handleDelete(cat.id, cat.name)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
