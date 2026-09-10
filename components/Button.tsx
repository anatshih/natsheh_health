import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'border border-slate-300 text-slate-700 hover:border-primary hover:text-primary',
  danger: 'border border-red-300 text-red-700 hover:bg-red-50',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

// زر موحّد لأزرار الإجراءات في لوحة الإدارة — كانت نفس الفئات (rounded-lg
// px-4 py-2 text-xs...) مكرَّرة يدويًا في كل شاشة بفروق طفيفة غير مقصودة
// (حجم خط، وجود hover، قيمة opacity عند التعطيل).
export default function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
