import Link from 'next/link';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';
import FacebookShareButton from '@/components/FacebookShareButton';

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center">
      <p className="text-sm font-semibold text-primary">
        مجلس عائلة النتشة — الخليل، فلسطين
      </p>
      <h1 className="text-3xl font-extrabold leading-snug text-slate-900 sm:text-4xl">
        دليل الكفاءات الصحية لعائلة النتشة
      </h1>

      <div className="max-w-2xl space-y-4 text-right text-base leading-8 text-slate-600">
        <p className="text-lg font-bold text-slate-800">
          كفاءات نفتخر بها، وخبرات نجمعها، وعطاء يمتد لخدمة العائلة والمجتمع.
        </p>
        <p>
          يجمع هذا الدليل أبناء وبنات عائلة النتشة العاملين والمتخصصين في
          القطاع الصحي داخل فلسطين وخارجها، في منصة موثوقة ومنظمة تعرّف بخبراتهم
          وتخصصاتهم وأماكن وجودهم، وتقرّب المسافات بين أبناء العائلة أينما كانوا.
        </p>
        <p>
          نطمح من خلال الدليل إلى التعرف بصورة أفضل إلى الكفاءات الصحية في
          العائلة، وتعزيز التواصل والتعاون بينها، وتسهيل الوصول إلى أصحاب
          الاختصاص، والاستفادة من خبراتهم في دعم أبناء العائلة، وتطوير المبادرات
          والخدمات الصحية، والمساهمة في خدمة المجتمع.
        </p>
        <p>
          كما يشكل الدليل أساسًا للتخطيط المستقبلي الذي يسهم في{' '}
          <strong className="font-bold text-slate-800">
            تنمية وتطوير الكوادر الصحية في العائلة، كلٌّ في مجال تخصصه
          </strong>
          ، من خلال التعرف إلى الخبرات المتاحة، واحتياجات التطوير، وفرص التدريب
          والتعاون وتبادل المعرفة، بما يعزز قدرات الكفاءات الصحية ويرفع من أثرها
          في خدمة العائلة والمجتمع.
        </p>
        <p className="font-bold text-slate-800">
          وجودك في الدليل يثري هذه المنظومة؛ سجّل بياناتك وكن جزءًا من شبكة تجمع
          كفاءات عائلة النتشة الصحية، وتدعم تطورها وعطاءها لخدمة العائلة
          والمجتمع.
        </p>
        <p className="text-center text-sm italic text-slate-400">
          بإشراف مجلس عائلة النتشة – الخليل، فلسطين.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/directory"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          استعرض الدليل
        </Link>
        <Link
          href="/join"
          className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          طلب انضمام
        </Link>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <WhatsAppShareButton
          text="دليل الكفاءات الصحية لعائلة النتشة — تصفّح الأطباء والكفاءات الصحية في العائلة:"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
        />
        <FacebookShareButton
          quote="دليل الكفاءات الصحية لعائلة النتشة — تصفّح الأطباء والكفاءات الصحية في العائلة:"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
        />
      </div>
    </main>
  );
}
