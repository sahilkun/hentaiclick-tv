import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AdminSidebar />
      <div className="lg:pl-56">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
