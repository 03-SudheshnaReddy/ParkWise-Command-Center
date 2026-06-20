import { Outlet, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HorizontalNavbar } from "./HorizontalNavbar";

export function AppShell() {
  const location = useLocation();
  const isLanding = location.pathname === "/landing";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[var(--color-page-bg)]">
        <HorizontalNavbar />

        <main className="flex min-h-screen flex-col pt-[72px]">
          <div
            className={cn(
              "flex-1",
              !isLanding && "mx-auto w-full max-w-[1800px] p-4 lg:p-5"
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
