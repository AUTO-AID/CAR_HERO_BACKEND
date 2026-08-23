/**
 * هوية الطرف داخل محادثة الطلب.
 *
 * عضوية المحادثة تُقاس بـ `[order.userId, order.providerId]`. ومعرّف المزوّد
 * هناك هو معرّف **وثيقة المزوّد**، بينما توكن الفنّي يحمل حساب المستخدم في
 * `id` ووثيقة المزوّد في `providerId`. استعمال `id` للفنّي كان يعني أحد
 * أمرين: رفضاً بـ 403، أو محادثة ثانية بزوج مشاركين مغاير لا يراها العميل.
 *
 * العميل والإداري يبقيان على `id`: لا وثيقة مزوّد لهما أصلاً.
 */
export function chatIdentityOf(user: any): string {
  const providerId = user?.providerId ? String(user.providerId) : null;
  if (providerId) return providerId;
  const id = user?.id ?? user?._id ?? user?.userId ?? user?.sub;
  return id ? String(id) : '';
}
