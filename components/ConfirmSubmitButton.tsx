'use client';

// زر إرسال نموذج (form action من جهة الخادم) يطلب تأكيدًا صريحًا قبل
// الإرسال — لاستخدامه داخل صفحات Server Component (الأب يبقى خادميًا، وهذا
// المكوّن الصغير وحده هو ما يحتاج 'use client' من أجل onClick/confirm).
export default function ConfirmSubmitButton({
  confirmMessage,
  children,
  className,
  name,
  value,
  disabled,
}: {
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
