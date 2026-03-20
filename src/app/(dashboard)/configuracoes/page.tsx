"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input, Select, Modal } from "@/components/ui";
import type { Settings, ApiResponse } from "@/types";

const pixKeyTypeOptions = [
  { value: "", label: "Selecione o tipo de chave" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatoria" },
];

const roleOptions = [
  { value: "admin", label: "Administrador" },
  { value: "viewer", label: "Visualizador" },
];

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

type Tab = "sistema" | "usuarios";

export default function ConfiguraçõesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sistema");

  // Settings state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    pixKeyType: "",
    pixKey: "",
    pixNomeBeneficiario: "",
    pixCidade: "",
    endereco: "",
    telefone: "",
    whatsapp: "",
    email: "",
  });

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserItem | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [userFormError, setUserFormError] = useState("");
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userSuccess, setUserSuccess] = useState("");

  // Fetch settings
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: ApiResponse<Settings>) => {
        if (data.success && data.data) {
          setFormData({
            pixKeyType: data.data.pixKeyType || "",
            pixKey: data.data.pixKey || "",
            pixNomeBeneficiario: data.data.pixNomeBeneficiario || "",
            pixCidade: data.data.pixCidade || "",
            endereco: data.data.endereco || "",
            telefone: data.data.telefone || "",
            whatsapp: data.data.whatsapp || "",
            email: data.data.email || "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      const data: ApiResponse<UserItem[]> = await res.json();
      if (data.success && data.data) setUsers(data.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Settings submit
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data: ApiResponse = await res.json();
      if (!data.success) {
        setError(data.error || "Erro ao salvar configurações");
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setSaving(false);
    }
  };

  // User modal
  const openNewUser = () => {
    setEditingUser(null);
    setUserForm({ name: "", email: "", password: "", role: "admin" });
    setUserFormError("");
    setUserModalOpen(true);
  };

  const openEditUser = (user: UserItem) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, password: "", role: user.role });
    setUserFormError("");
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError("");
    setUserFormLoading(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const body: Record<string, string> = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      };
      if (userForm.password) body.password = userForm.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ApiResponse = await res.json();
      if (!data.success) {
        setUserFormError(data.error || "Erro ao salvar usuário");
        return;
      }
      setUserModalOpen(false);
      setUserSuccess(editingUser ? "Usuário atualizado com sucesso" : "Usuário criado com sucesso");
      setTimeout(() => setUserSuccess(""), 3000);
      fetchUsers();
    } catch {
      setUserFormError("Erro ao conectar com o servidor");
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/users/${deleteConfirm.id}`, { method: "DELETE" });
      const data: ApiResponse = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        setUserSuccess("Usuário excluído com sucesso");
        setTimeout(() => setUserSuccess(""), 3000);
        fetchUsers();
      } else {
        setDeleteConfirm(null);
        setUserFormError(data.error || "Erro ao excluir");
        setTimeout(() => setUserFormError(""), 3000);
      }
    } catch {
      console.error("Error deleting user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-[#00AEEF] text-[32px]">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
          Configurações
        </h1>
        <p className="text-[var(--text-tertiary)] text-[15px]">
          Gerencie as configurações do sistema e usuários
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] w-fit">
        <button
          onClick={() => setActiveTab("sistema")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
            activeTab === "sistema"
              ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          Sistema
        </button>
        <button
          onClick={() => setActiveTab("usuarios")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
            activeTab === "usuarios"
              ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          Usuários
        </button>
      </div>

      {/* Tab: Sistema */}
      {activeTab === "sistema" && (
        <form onSubmit={handleSettingsSubmit} className="flex flex-col gap-8">
          {/* PIX Section */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(0,174,239,0.1)]">
                <span className="material-symbols-outlined text-[#00AEEF] text-[22px]">qr_code_2</span>
              </div>
              <div>
                <h2 className="text-[var(--text-primary)] text-[18px] font-semibold">PIX</h2>
                <p className="text-[var(--text-tertiary)] text-[13px]">Configurações para geração de QR Code PIX nos recibos</p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Tipo de Chave PIX"
                  options={pixKeyTypeOptions}
                  value={formData.pixKeyType}
                  onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value })}
                />
                <Input
                  label="Chave PIX"
                  placeholder="Digite a chave PIX"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  hint="A chave conforme o tipo selecionado"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Beneficiário"
                  placeholder="Ex: J AMARAL CONTABIL"
                  value={formData.pixNomeBeneficiario}
                  onChange={(e) => setFormData({ ...formData, pixNomeBeneficiario: e.target.value })}
                  hint="Nome que aparecerá no QR Code (max 25 caracteres)"
                />
                <Input
                  label="Cidade"
                  placeholder="Ex: São Paulo"
                  value={formData.pixCidade}
                  onChange={(e) => setFormData({ ...formData, pixCidade: e.target.value })}
                  hint="Cidade do beneficiário (max 15 caracteres)"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(46,49,146,0.1)]">
                <span className="material-symbols-outlined text-[#2E3192] text-[22px]">contact_page</span>
              </div>
              <div>
                <h2 className="text-[var(--text-primary)] text-[18px] font-semibold">Informações de Contato</h2>
                <p className="text-[var(--text-tertiary)] text-[13px]">Dados que serão exibidos no rodape dos recibos PDF</p>
              </div>
            </div>
            <div className="grid gap-4">
              <Input
                label="Endereço"
                placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo/SP"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                icon="location_on"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Telefone"
                  placeholder="(11) 1234-5678"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  icon="call"
                />
                <Input
                  label="WhatsApp"
                  placeholder="(11) 91234-5678"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  icon="chat"
                />
              </div>
              <Input
                label="E-mail"
                type="email"
                placeholder="contato@jccontabilidade.com.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon="mail"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(52,199,89,0.1)] border border-[rgba(52,199,89,0.2)] text-[#34C759] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Configurações salvas com sucesso!
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={saving} icon={saving ? undefined : "save"}>
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      )}

      {/* Tab: Usuários */}
      {activeTab === "usuarios" && (
        <div className="flex flex-col gap-6">
          {/* Header + Add button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[var(--text-primary)] text-[18px] font-semibold">Gerenciar Usuários</h2>
              <p className="text-[var(--text-tertiary)] text-[13px]">Crie, edite e gerencie os acessos ao sistema</p>
            </div>
            <Button onClick={openNewUser} icon="person_add" size="sm">
              Novo Usuário
            </Button>
          </div>

          {userSuccess && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(52,199,89,0.1)] border border-[rgba(52,199,89,0.2)] text-[#34C759] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              {userSuccess}
            </div>
          )}

          {userFormError && !userModalOpen && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {userFormError}
            </div>
          )}

          {/* Users list */}
          {usersLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-[#00AEEF] text-[32px]">progress_activity</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl">
              <div className="size-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-[var(--text-quaternary)]">group_off</span>
              </div>
              <p className="text-[var(--text-tertiary)] text-[15px]">Nenhum usuário cadastrado</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-bold text-[14px]">
                      {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[var(--text-primary)] text-[15px] font-medium">{user.name}</p>
                      <p className="text-[var(--text-tertiary)] text-[13px]">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${
                      user.role === "admin"
                        ? "bg-[rgba(0,174,239,0.1)] text-[#00AEEF]"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                    }`}>
                      {user.role === "admin" ? "Admin" : "Visualizador"}
                    </span>
                    <button
                      onClick={() => openEditUser(user)}
                      className="flex items-center justify-center size-9 rounded-full text-[var(--text-tertiary)] hover:text-[#00AEEF] hover:bg-[rgba(0,174,239,0.1)] transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="flex items-center justify-center size-9 rounded-full text-[var(--text-tertiary)] hover:text-[#FF3B30] hover:bg-[rgba(255,59,48,0.1)] transition-colors"
                      title="Excluir"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? "Editar Usuário" : "Novo Usuário"}
        description={editingUser ? "Altere os dados do usuário" : "Preencha os dados do novo usuário"}
      >
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Ex: João Silva"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            required
            icon="person"
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="joao@empresa.com"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            required
            icon="mail"
          />
          <Input
            label={editingUser ? "Nova Senha" : "Senha"}
            type="password"
            placeholder={editingUser ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            required={!editingUser}
            icon="lock"
            hint={editingUser ? "Deixe em branco para não alterar" : "Mínimo 6 caracteres"}
          />
          <Select
            label="Função"
            options={roleOptions}
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
          />

          {userFormError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {userFormError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={userFormLoading}>
              {editingUser ? "Atualizar" : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-tertiary)] text-[15px]">
            Tem certeza que deseja excluir o usuário{" "}
            <strong className="text-[var(--text-primary)]">{deleteConfirm?.name}</strong>?
          </p>
          <p className="text-[14px] text-[#FF9500] bg-[rgba(255,149,0,0.1)] p-4 rounded-xl border border-[rgba(255,149,0,0.2)] flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] mt-0.5">warning</span>
            <span>Esta ação não pode ser desfeita. O usuário perderá acesso ao sistema.</span>
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteUser}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
