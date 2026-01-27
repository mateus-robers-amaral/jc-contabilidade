import { MainLayout } from "@/components/layout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <MainLayout userName={user.name} userRole={user.role}>
      {children}
    </MainLayout>
  );
}
