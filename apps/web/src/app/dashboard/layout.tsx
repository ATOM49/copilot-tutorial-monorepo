import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex w-full flex-col">
          <header className="flex h-12 items-center gap-2 border-b px-3">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">
              In-app Copilot learning tracker
            </div>
          </header>

          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
