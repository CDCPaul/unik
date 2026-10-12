import { redirect } from 'next/navigation';

// 3부에서 신청자 관리(/admin/applicants)로 바뀐다.
export default function AdminIndexPage() {
  redirect('/admin/business-cards');
}
