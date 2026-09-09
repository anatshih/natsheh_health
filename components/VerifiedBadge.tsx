// شارة توثيق بجانب الاسم مباشرة — كل من يظهر في الدليل العام معتمد فعلاً
// (directory_public لا تعرض إلا الحسابات المعتمدة والمنشورة، القسم 23).
export default function VerifiedBadge() {
  return (
    <span
      title="كفاءة معتمدة"
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary"
    >
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l2.5 2.5L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
