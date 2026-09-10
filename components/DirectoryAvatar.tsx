import VerifiedBadge from './VerifiedBadge';
import { specialtyColor } from '@/lib/specialtyColors';

// صورة رمزية للعضو: صورته الفعلية إن سمح بعرضها، وإلا دائرة بلون مشتق من
// مجاله الصحي وحرفه الأول (بدل صورة افتراضية ثابتة لا تشبه هوية الموقع).
// شارة التوثيق مدمجة كطبقة متراكبة على الزاوية بدل عنصر منفصل بجانب الاسم.
export default function DirectoryAvatar({
  photoUrl,
  name,
  size = 56,
  category,
  verified = true,
}: {
  photoUrl?: string | null;
  name: string;
  size?: number;
  category?: string | null;
  verified?: boolean;
}) {
  const initial = name.trim().charAt(0) || '؟';
  const color = specialtyColor(category);
  const badgeSize = Math.max(14, Math.round(size * 0.32));

  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          style={{ width: size, height: size }}
          className="rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex items-center justify-center rounded-full font-display font-bold text-white"
          style={{ width: size, height: size, background: color.solid, fontSize: Math.round(size * 0.4) }}
        >
          {initial}
        </span>
      )}
      {verified && (
        <span className="absolute -bottom-0.5 -left-0.5">
          <VerifiedBadge size={badgeSize} />
        </span>
      )}
    </span>
  );
}
