export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  cnpj: string;
  email: string | null;
  responsavel: string | null;
  createdAt: Date;
  updatedAt: Date;
  recibos?: Recibo[];
}

export interface Recibo {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  mesReferencia: Date;
  honorario: number;
  decimoTerceiro: number;
  registro: number;
  alteracao: number;
  materialExpediente: number;
  outros: number;
  detalhamento: string | null;
  total: number;
  status: "pendente" | "pago" | "cancelado";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClienteDTO {
  nome: string;
  cnpj: string;
  email?: string;
  responsavel?: string;
}

export interface UpdateClienteDTO {
  nome?: string;
  cnpj?: string;
  email?: string;
  responsavel?: string;
}

export interface CreateReciboDTO {
  clienteId: string;
  mesReferencia: string;
  honorario: number;
  decimoTerceiro?: number;
  registro?: number;
  alteracao?: number;
  outros?: number;
  detalhamento?: string;
}

export interface UpdateReciboDTO {
  clienteId?: string;
  mesReferencia?: string;
  honorario?: number;
  decimoTerceiro?: number;
  registro?: number;
  alteracao?: number;
  outros?: number;
  detalhamento?: string;
  status?: "pendente" | "pago" | "cancelado";
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Settings {
  id: string;
  pixKeyType: string | null;
  pixKey: string | null;
  pixNomeBeneficiario: string | null;
  pixCidade: string | null;
  endereco: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  updatedAt: Date;
}

export interface UpdateSettingsDTO {
  pixKeyType?: string;
  pixKey?: string;
  pixNomeBeneficiario?: string;
  pixCidade?: string;
  endereco?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
}
