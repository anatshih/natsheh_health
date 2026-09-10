// شارة توثيق بشكل درع — كل من يظهر في الدليل العام معتمد فعلاً (directory_public
// لا تعرض إلا الحسابات المعتمدة والمنشورة، القسم 23). تُستخدم كطبقة متراكبة على
// زاوية الصورة الرمزية (انظر DirectoryAvatar) بدل نقطة منفصلة بجانب الاسم.
export default function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      title="كفاءة معتمدة من مجلس عائلة النتشة"
      className="inline-block drop-shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V5z"
          fill="#A8324A"
          stroke="#fff"
          strokeWidth="1.5"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="#fff"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
