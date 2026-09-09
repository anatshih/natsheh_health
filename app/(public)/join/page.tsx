const STEPS = [
  'بيانات الهوية والحساب',
  'البيانات المهنية',
  'المساهمة المستقبلية',
  'المراجعة والإرسال',
];

// TODO: هذا هيكل عرض أولي للخطوة الأولى فقط. يبقى المطلوب لاحقًا:
// - ربط الحقول بـ react-hook-form + zod للتحقق من الصحة.
// - Server Action ينشئ مستخدم Supabase Auth ببريد داخلي مصطنع (القسم 14)
//   ثم صفًا في app_users + identities + applications بحالة "draft".
// - بناء بقية الخطوات (2، 3، 4) بنفس نمط الـ Stepper.
export default function JoinPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-extrabold">طلب انضمام إلى الدليل</h1>
      <p className="mb-8 text-sm text-slate-600">
        دليل الكفاءات الصحية — عائلة النتشة
      </p>

      <ol className="mb-10 flex gap-2 text-xs font-semibold text-slate-400">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 border-t-2 pt-2 text-center ${
              i === 0 ? 'border-primary text-primary' : 'border-slate-200'
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <Field label="رقم الهوية" required />
        <Field label="الاسم الكامل حسب الهوية" required />
        <Field label="الفخذ / الفرع العائلي" required as="select" />
        <Field label="رقم الهاتف" required />
        <Field label="رقم الواتساب" required />
        <Field label="الدولة" required as="select" />
        <Field label="المدينة / مكان الإقامة" required as="select" />
        <Field label="البريد الإلكتروني" optional />
        <Field label="كلمة المرور" required type="password" />
        <Field label="تأكيد كلمة المرور" required type="password" />

        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" required className="mt-0.5" />
          <span>أوافق على سياسة الخصوصية وشروط استخدام الدليل</span>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white"
        >
          التالي: البيانات المهنية ›
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  required,
  optional,
  as = 'input',
  type = 'text',
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  as?: 'input' | 'select';
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="mr-1 text-accent">*</span>}
        {optional && <span className="mr-1 font-normal text-slate-400">(اختياري)</span>}
      </label>
      {as === 'select' ? (
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="" />
        </select>
      ) : (
        <input
          type={type}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
