// زر تبديل بشكل مفتاح (Switch) بدل شارة نصية، مع نص توضيحي دائمًا بجانبه
// حتى لا يعتمد الفهم على اللون وحده (القسم 51 من الوثيقة).
export default function ToggleSwitch({ active, activeLabel = 'نشط', inactiveLabel = 'معطّل' }: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={active}
      className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap"
    >
      <span
        className={`shrink-0 whitespace-nowrap text-xs font-semibold ${
          active ? 'text-emerald-700' : 'text-slate-500'
        }`}
      >
        {active ? activeLabel : inactiveLabel}
      </span>
      <span
        className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${
          active ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            active ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}
