'use client';

import { useEffect, useState } from 'react';

// عدّاد متحرك بسيط لأرقام الإحصاءات — يبدأ من صفر ويتصاعد حتى القيمة الفعلية،
// مع نبضة خفيفة عند الوصول للرقم النهائي بدل توقف جامد.
export default function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    let start: number | null = null;
    let raf: number;

    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setPulsing(true);
        setTimeout(() => setPulsing(false), 320);
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span
      className="inline-block transition-transform duration-300"
      style={{ transform: pulsing ? 'scale(1.12)' : 'scale(1)' }}
    >
      {display}
    </span>
  );
}
