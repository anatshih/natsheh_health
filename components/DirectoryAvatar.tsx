// صورة افتراضية رسمية (بدل الفراغ أو أيقونة عامة) عند غياب صورة المستخدم —
// اعتمدها مجلس عائلة النتشة كصورة موحّدة لكل من لم يرفع صورته الخاصة.
export default function DirectoryAvatar({
  photoUrl,
  name,
  size = 56,
}: {
  photoUrl?: string | null;
  name: string;
  size?: number;
}) {
  return (
    <img
      src={photoUrl || '/default-avatar.png'}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover"
    />
  );
}
