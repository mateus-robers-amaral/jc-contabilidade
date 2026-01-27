"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Input } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Erro ao fazer login");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-4 transition-theme">
      {/* Theme Toggle - Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-[var(--surface-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[#00AEEF] transition-all shadow-sm hover:shadow-md"
      >
        <span className="material-symbols-outlined text-[20px]">
          {theme === "light" ? "dark_mode" : "light_mode"}
        </span>
      </button>

      <div className="w-full max-w-[420px] animate-fadeIn">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center size-24 rounded-3xl bg-white shadow-xl shadow-[rgba(0,174,239,0.2)] mb-5 overflow-hidden">
            <Image
              src="/logoJC.png"
              alt="JC Contabilidade"
              width={96}
              height={96}
              className="object-contain p-2"
            />
          </div>
          <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
            JC Contabilidade
          </h1>
          <p className="text-[var(--text-tertiary)] text-[15px] mt-1">
            Sistema de Gestao Fiscal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-8 shadow-xl transition-theme">
          <div className="text-center mb-8">
            <h2 className="text-[var(--text-primary)] text-[22px] font-bold">
              Bem-vindo de volta
            </h2>
            <p className="text-[var(--text-tertiary)] text-[15px] mt-1">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon="mail"
            />

            <Input
              type="password"
              label="Senha"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              icon={loading ? undefined : "login"}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[var(--border-primary)]" />
            <span className="text-[var(--text-tertiary)] text-[12px] font-medium">
              PRIMEIRO ACESSO?
            </span>
            <div className="flex-1 h-px bg-[var(--border-primary)]" />
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-xl bg-[rgba(0,174,239,0.08)] border border-[rgba(0,174,239,0.15)]">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#00AEEF] text-[20px] mt-0.5">
                info
              </span>
              <div>
                <p className="text-[var(--text-secondary)] text-[13px]">
                  Execute o seed do banco para criar um usuario de teste:
                </p>
                <code className="block mt-2 text-[12px] text-[#00AEEF] bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg font-mono">
                  npm run db:seed
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[var(--text-tertiary)] text-[13px] mt-8">
          &copy; {new Date().getFullYear()} JC Contabilidade. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
