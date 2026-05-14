import { ReactNode } from "react";
import { Bell } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  compactHeader?: boolean;
};

export default function AppFrame({ title, subtitle, right, children, compactHeader }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 border-b border-sidebar-border/80 bg-sidebar/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              {!compactHeader ? (
                <div>
                  <h1 className="text-sm font-semibold md:text-base">{title}</h1>
                  {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button type="button" variant="outline" size="icon" className="rounded-full">
                <Bell className="h-4 w-4" />
              </Button>
              {right}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
