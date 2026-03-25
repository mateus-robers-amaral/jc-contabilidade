"use client";

import { useRouter } from "next/navigation";

interface TopbarProps {
  userName?: string;
  onMenuClick?: () => void;
}

export default function Topbar({ userName = "Usuario", onMenuClick }: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between whitespace-nowrap border-b border-[var(--border-primary)] bg-[var(--surface-primary)]/95 backdrop-blur-lg px-6 py-3 transition-theme">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-[var(--text-primary)] mr-4 p-2 hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Notifications */}
        <button className="flex items-center justify-center size-10 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[#00AEEF] transition-colors relative">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-[#00AEEF] rounded-full border-2 border-[var(--surface-primary)]"></span>
        </button>

        {/* Help */}
        <button className="hidden md:flex items-center justify-center size-10 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[#00AEEF] transition-colors">
          <span className="material-symbols-outlined text-[20px]">help</span>
        </button>

        <div className="w-px h-8 bg-[var(--border-primary)] mx-2"></div>

        {/* User Menu */}
        <div className="relative group">
          <button className="flex items-center gap-2 rounded-full pr-1 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center size-9 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-semibold text-[12px] shadow-sm">
              {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[14px] text-[var(--text-secondary)] hover:text-[#FF3B30] hover:bg-[rgba(255,59,48,0.1)] rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
