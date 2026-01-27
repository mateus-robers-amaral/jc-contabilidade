"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface MainLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export default function MainLayout({
  children,
  userName = "Usuario",
  userRole = "Admin",
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-primary)] transition-theme">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar userName={userName} userRole={userRole} />
      </div>

      {/* Desktop Sidebar */}
      <Sidebar userName={userName} userRole={userRole} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[var(--bg-secondary)]">
        <Topbar userName={userName} onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-10 lg:py-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
