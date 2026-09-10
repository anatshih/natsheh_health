'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addCategory, toggleCategory, addSpecialty, toggleSpecialty } from './actions';
import ToggleSwitch from '@/components/ToggleSwitch';
import SettingsTabs from '@/components/SettingsTabs';

type Row = { id: string; name: string; is_active: boolean; category_id?: string; parent_id?: string | null };

// إدارة المجالات الصحية والتخصصات (الرئيسية والدقيقة) — القسم 7 و27.
export default function SpecialtiesPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Row[]>([]);
  const [specialties, setSpecialties] = useState<Row[]>([]);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newParentId, setNewParentId] = useState('');

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: me } = await supabase
      .from('app_users')
      .select('role')
      .eq('auth_user_id', user?.id)
      .single();
    setIsAdmin(me?.role === 'admin');

    const [{ data: cats }, { data: specs }] = await Promise.all([
      supabase.from('specialty_categories').select('*').order('sort_order').order('name'),
      supabase.from('specialties').select('*').order('sort_order').order('name'),
    ]);
    setCategories(cats ?? []);
    setSpecialties(specs ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const mainOptionsForNewCategory = specialties.filter(
    (s) => s.category_id === newCategoryId && !s.parent_id
  );

  return (
    <div className="mx-auto max-w-3xl">
      <SettingsTabs active="specialties" />
      <div className="space-y-8">
      <h2 className="text-lg font-bold">إدارة المجالات الصحية والتخصصات</h2>

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          إدارة التخصصات مقصورة على المدير.
        </p>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700">المجالات الصحية الرئيسية</h3>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 text-sm">
                <span>{c.name}</span>
                {isAdmin && (
                  <form
                    action={async (fd) => {
                      await toggleCategory(fd);
                      load();
                    }}
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="nextActive" value={(!c.is_active).toString()} />
                    <ToggleSwitch active={c.is_active} itemName={c.name} />
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <form
            action={async (fd) => {
              await addCategory(fd);
              load();
            }}
            className="mt-3 flex gap-2 rounded-xl border border-slate-200 bg-white p-5"
          >
            <input
              name="name"
              required
              placeholder="اسم المجال الصحي الجديد"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">
              إضافة
            </button>
          </form>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700">التخصصات (الرئيسية والدقيقة)</h3>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="space-y-2">
            {specialties.map((s) => {
              const category = categories.find((c) => c.id === s.category_id);
              const parent = specialties.find((p) => p.id === s.parent_id);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 text-sm"
                >
                  <span className={s.parent_id ? 'pr-4 text-slate-600' : 'font-semibold'}>
                    {s.parent_id ? '— ' : ''}
                    {s.name}
                    <span className="mr-2 text-xs text-slate-400">
                      ({category?.name}
                      {parent ? ` / ${parent.name}` : ''})
                    </span>
                  </span>
                  {isAdmin && (
                    <form
                      action={async (fd) => {
                        await toggleSpecialty(fd);
                        load();
                      }}
                    >
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="nextActive" value={(!s.is_active).toString()} />
                      <ToggleSwitch active={s.is_active} itemName={s.name} />
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <form
            action={async (fd) => {
              await addSpecialty(fd);
              setNewParentId('');
              load();
            }}
            className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-5"
          >
            <select
              name="category_id"
              required
              value={newCategoryId}
              onChange={(e) => {
                setNewCategoryId(e.target.value);
                setNewParentId('');
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">المجال الصحي</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              name="parent_id"
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">تخصص رئيسي جديد (بدون تخصص أب)</option>
              {mainOptionsForNewCategory.map((s) => (
                <option key={s.id} value={s.id}>
                  دقيق تابع لـ: {s.name}
                </option>
              ))}
            </select>

            <input
              name="name"
              required
              placeholder="اسم التخصص"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">
              إضافة تخصص
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
