import Navbar from '@/components/custom/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">{children}</main>
    </div>
  );
}
