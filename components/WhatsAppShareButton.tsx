'use client';

// زر مشاركة سريع عبر واتساب — القناة الأساسية لوصول العائلة للدليل أصلاً
// (القسم 50 من الوثيقة)، فأقصر مسافة بين "شاهدت الدليل" و"دعوت أحدًا" هي زر هنا.
export default function WhatsAppShareButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  function handleShare() {
    const url = window.location.href;
    const shareText = `${text}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <button onClick={handleShare} className={className}>
      <WhatsAppIcon />
      مشاركة عبر واتساب
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366" className="shrink-0">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.87.5 3.62 1.38 5.12L2 22l4.99-1.35C8.42 21.5 10.16 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm5.3 14.3c-.23.66-1.35 1.24-1.85 1.29-.5.06-.98.25-3.28-.68-2.78-1.14-4.55-3.9-4.7-4.08-.14-.19-1.11-1.48-1.11-2.82s.71-2 .96-2.27c.25-.27.55-.34.73-.34h.53c.17 0 .4-.06.62.48.23.55.79 1.9.86 2.04.07.14.11.3.02.49-.09.19-.14.3-.27.46-.14.17-.29.37-.41.5-.14.14-.28.29-.12.57.16.28.71 1.19 1.53 1.93 1.05.95 1.94 1.25 2.22 1.39.28.14.44.12.61-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.63-.14.26.09 1.63.77 1.91.91.28.14.46.21.53.33.07.12.07.65-.16 1.31Z" />
    </svg>
  );
}
