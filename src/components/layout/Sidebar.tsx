"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: "space_dashboard" },
  { href: "/recibos", label: "Recibos", icon: "receipt_long" },
  { href: "/clientes", label: "Clientes", icon: "groups" },
  { href: "/configuracoes", label: "Configuracoes", icon: "settings" },
];

interface SidebarProps {
  userName?: string;
  userRole?: string;
}

export default function Sidebar({ userName = "Usuario", userRole = "Admin" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex w-[280px] flex-col h-full bg-[var(--surface-primary)] border-r border-[var(--border-primary)] transition-theme">
      <div className="flex flex-col h-full p-5 justify-between">
        <div className="flex flex-col gap-8">
          {/* Branding */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center justify-center size-11 rounded-2xl overflow-hidden bg-white shadow-lg shadow-[rgba(0,174,239,0.2)]">
              <Image
                src="/logoJC.png"
                alt="JC Contabilidade"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[var(--text-primary)] text-[17px] font-bold tracking-tight">
                JC Contabilidade
              </h1>
              <p className="text-[var(--text-tertiary)] text-[12px] font-medium">
                Gestao Fiscal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            <p className="text-[var(--text-tertiary)] text-[11px] font-semibold uppercase tracking-wider px-3 mb-2">
              Menu
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-[rgba(0,174,239,0.12)] text-[#00AEEF]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      isActive ? "" : "group-hover:text-[#00AEEF]"
                    } transition-colors`}
                  >
                    {item.icon}
                  </span>
                  <span className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00AEEF]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 group w-full"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:text-[#00AEEF] transition-colors">
              {theme === "light" ? "dark_mode" : "light_mode"}
            </span>
            <span className="text-[15px] font-medium">
              {theme === "light" ? "Modo Escuro" : "Modo Claro"}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[rgba(255,59,48,0.1)] hover:text-[#FF3B30] transition-all duration-200 group w-full"
          >
            <span className="material-symbols-outlined text-[22px] transition-colors">
              logout
            </span>
            <span className="text-[15px] font-medium">Sair</span>
          </button>

          {/* User Profile */}
          <div className="mt-3 pt-4 border-t border-[var(--border-primary)]">
            <div className="flex items-center gap-3 px-1">
              <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-semibold text-[13px]">
                {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-[14px] font-semibold truncate">
                  {userName}
                </p>
                <p className="text-[var(--text-tertiary)] text-[12px]">{userRole}</p>
              </div>
              <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[18px]">
                chevron_right
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
