'use client';

// زر مشاركة سريع عبر فيسبوك، بجانب زر واتساب (القسم 50)، لأن بعض أفراد
// العائلة يتابعون صفحة المجلس على فيسبوك أكثر من متابعتهم مجموعات واتساب.
export default function FacebookShareButton({
  quote,
  className,
}: {
  quote: string;
  className?: string;
}) {
  function handleShare() {
    const url = window.location.href;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
  }

  return (
    <button onClick={handleShare} className={className}>
      <FacebookIcon />
      مشاركة عبر فيسبوك
    </button>
  );
}

function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2" className="shrink-0">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}
