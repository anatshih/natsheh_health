// أيقونة افتراضية أنيقة بدل الفراغ عند غياب صورة (بدلاً من مربع فارغ أو حرف أول فقط).
export default function DirectoryAvatar({
  photoUrl,
  name,
  size = 56,
}: {
  photoUrl?: string | null;
  name: string;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-primary-soft text-primary"
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M4.5 19.2c1.4-3.2 4-4.8 7.5-4.8s6.1 1.6 7.5 4.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M9 3.2c0 1.2.5 1.8 1.4 2.1M15 3.2c0 1.2-.5 1.8-1.4 2.1"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
