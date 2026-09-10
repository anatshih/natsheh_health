// تلوين تصنيفي بسيط للمجال الصحي — يُستخدم لشريط بطاقة العضو ولون الأفاتار
// الافتراضي (الحرف الأول) بدل الاعتماد الكلي على الأزرق في كل مكان. لا يحتاج
// تخزين لون لكل مجال في القاعدة: يُشتق حتميًا من اسم المجال نفسه بحيث يبقى
// نفس المجال بنفس اللون دائمًا.
const PALETTE = [
  { solid: '#005CB6', soft: '#E4EEFB', text: '#005CB6' },
  { solid: '#A8324A', soft: '#F5E3E7', text: '#A8324A' },
  { solid: '#6E7B3D', soft: '#EEF0E1', text: '#6E7B3D' },
] as const;

export function specialtyColor(categoryName?: string | null) {
  if (!categoryName) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = (hash * 31 + categoryName.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
