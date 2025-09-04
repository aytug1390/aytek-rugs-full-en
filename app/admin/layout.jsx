// Global styles already included in root layout, duplicate import removed.
import AdminLayout from '../components/admin/AdminLayout';

export const metadata = { title: 'Admin | Aytek Rugs' };

export default function RootAdminLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}

