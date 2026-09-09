// زر تبديل بشكل مفتاح (Switch) بدل شارة نصية، مع نص توضيحي دائمًا بجانبه
// حتى لا يعتمد الفهم على اللون وحده (القسم 51 من الوثيقة).
export default function ToggleSwitch({ active, activeLabel = 'نشط', inactiveLabel = 'معطّل' }: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <button type="submit" role="switch" aria-checked={active} className="flex items-center gap-2">
      <span className={`text-xs font-semibold ${active ? 'text-emerald-700' : 'text-slate-500'}`}>
        {active ? activeLabel : inactiveLabel}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          active ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            active ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}
