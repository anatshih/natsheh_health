import Link from 'next/link';

// صفحة "عن الدليل" (القسم 11 من الوثيقة يذكرها ضمن القائمة الرئيسية).
// تشرح رسالة الدليل والجهة المشرفة عليه بشكل مستقل عن الصفحة الرئيسية المختصرة.
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-extrabold text-slate-900">عن الدليل</h1>
      <p className="mb-10 text-sm font-semibold text-primary">
        مجلس عائلة النتشة — الخليل، فلسطين
      </p>

      <div className="space-y-8">
        <Section title="رسالتنا">
          <p>
            يجمع دليل الكفاءات الصحية أبناء وبنات عائلة النتشة العاملين والمتخصصين
            في القطاع الصحي داخل فلسطين وخارجها، في منصة موثوقة ومنظمة تعرّف بخبراتهم
            وتخصصاتهم وأماكن وجودهم، وتقرّب المسافات بين أبناء العائلة أينما كانوا.
          </p>
        </Section>

        <Section title="لماذا هذا الدليل؟">
          <p>
            نطمح من خلاله إلى التعرف بصورة أفضل إلى الكفاءات الصحية في العائلة،
            وتعزيز التواصل والتعاون بينها، وتسهيل الوصول إلى أصحاب الاختصاص،
            والاستفادة من خبراتهم في دعم أبناء العائلة، وتطوير المبادرات والخدمات
            الصحية، والمساهمة في خدمة المجتمع.
          </p>
          <p>
            كما يشكل الدليل أساسًا للتخطيط المستقبلي الذي يسهم في تنمية وتطوير
            الكوادر الصحية في العائلة، كلٌّ في مجال تخصصه، من خلال التعرف إلى
            الخبرات المتاحة، واحتياجات التطوير، وفرص التدريب والتعاون وتبادل
            المعرفة.
          </p>
        </Section>

        <Section title="من يشمله الدليل">
          <p>
            كل من ينتمي لعائلة النتشة، سواء كان طبيبًا أو صيدلانيًا أو ممرضًا أو
            أخصائيًا في أي من فروع القطاع الصحي، وكذلك <strong>طلاب وطالبات</strong>{' '}
            التخصصات الصحية والمتدربون الذين ما زالوا في بداية مسيرتهم المهنية —
            فالدليل يوثّق الكفاءات القائمة، ويستشرف الكفاءات الصاعدة أيضًا.
          </p>
        </Section>

        <Section title="كيف يعمل الدليل؟">
          <p>
            يسجّل كل شخص بياناته بنفسه، ثم تمر هذه البيانات بمراجعة وتحقق من فريق
            مخوّل من المجلس قبل اعتمادها ونشرها في الدليل العام. يتحكم كل شخص
            ببياناته الخاصة، ويحدد بنفسه ما يسمح بعرضه للزوار. لمزيد من التفاصيل،
            راجع{' '}
            <Link href="/privacy" className="text-primary underline">
              سياسة الخصوصية والاستخدام
            </Link>
            .
          </p>
        </Section>

        <Section title="الإشراف على الدليل">
          <p>
            يملك الدليل ويشرف عليه <strong>مجلس عائلة النتشة — الخليل، فلسطين</strong>،
            ويتم تشغيله وإدارته من خلال الأشخاص المخولين رسميًا من المجلس.
          </p>
        </Section>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
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
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-slate-800">{title}</h2>
      <div className="space-y-2 text-sm leading-8 text-slate-600">{children}</div>
    </section>
  );
}
