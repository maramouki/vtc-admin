import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen">
      <Sidebar societeName={session.societeName} />
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
