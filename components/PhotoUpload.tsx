'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const MAX_SIZE = 5 * 1024 * 1024; // 5 ميغابايت (القسم 15)
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

// رفع/تغيير الصورة الشخصية. المسار في التخزين يبدأ دائمًا بمعرّف المستخدم في
// Supabase Auth، وهذا هو الشرط الذي تتحقق منه سياسات storage.objects (القسم 15).
export default function PhotoUpload({
  currentUrl,
  onUploaded,
}: {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}) {
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      setError('الصيغ المسموحة: JPG أو PNG فقط.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('الحد الأقصى لحجم الصورة 5 ميغابايت.');
      return;
    }

    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('يجب تسجيل الدخول أولاً.');
      setUploading(false);
      return;
    }

    const path = `${user.id}/photo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError('تعذّر رفع الصورة. حاول مرة أخرى.');
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('profile-photos').getPublicUrl(path);
    // كسر التخزين المؤقت للمتصفح بعد كل استبدال لنفس المسار
    const bustedUrl = `${publicUrl}?t=${Date.now()}`;

    setPreview(bustedUrl);
    setUploading(false);
    onUploaded(bustedUrl);
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <img src={preview} alt="الصورة الشخصية" className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
          بدون صورة
        </div>
      )}
      <div>
        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          {uploading ? 'جارٍ الرفع…' : 'اختيار صورة'}
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <p className="mt-1 text-[11px] text-slate-400">JPG أو PNG، بحد أقصى 5 ميغابايت.</p>
        {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
      </div>
    </div>
  );
}
