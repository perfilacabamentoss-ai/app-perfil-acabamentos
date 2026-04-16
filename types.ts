
import React from 'react';

export enum View {
  DASHBOARD = 'dashboard',
  OBRAS = 'obras',
  PROJETOS = 'projects',
  ETAPAS = 'etapas',
  FORNECEDORES = 'fornecedores',
  EMPREITEIROS = 'empreiteiros',
  COLABORADORES = 'colaboradores',
  PONTO = 'ponto',
  MATERIAIS = 'materiais',
  MEDICOES = 'medicoes',
  FATURAS = 'faturas',
  PAGAMENTOS = 'pagamentos',
  PRODUCAO = 'producao',
  PEDIDOS = 'pedidos',
  CALCULADORAS = 'calculadoras',
  YOUTUBE = 'youtube',
  AUTONOMO = 'autonomo',
  CONTROLE_ACESSO = 'controle-acesso',
  CONFIGURACOES = 'configuracoes',
  LEITURA_PROJETOS = 'leitura-projetos',
  TUTORIAL = 'tutorial',
  PROPOSTAS = 'propostas',
  PLANEJAMENTO_ESTRATEGICO = 'planejamento-estrategico',
  CLIENTES = 'clientes',
  COLABORADOR_PORTAL = 'colaborador-portal',
  QA_CHAT = 'qa-chat',
  DECOR = 'decor',
  PROFISSIONAIS = 'profissionais'
}

export interface NotificationSettings {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  notifyExpiration: boolean;
  notifyLowStock: boolean;
  notifyNewInvoices: boolean;
  notifyDailySummary: boolean;
  notifyLateClockIn: boolean;
  expirationAdvanceDays: number;
}

export interface Measurement {
  id: string;
  workId: string;
  workName: string;
  date: string;
  description: string;
  value: number;
  status: 'Pendente' | 'Aprovado' | 'Pago';
  globalValue?: number;
  retentionPercentage?: number;
  retentionValue?: number;
  netValue?: number;
}

export interface Invoice {
  id: string;
  supplierId: string;
  supplierName: string;
  issueDate: string;
  dueDate: string;
  value: number;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  category: string;
  product?: string;
}

export interface Payment {
  id: string;
  recipientId: string;
  recipientName: string;
  type: 'Colaborador' | 'Fornecedor' | 'Empreiteiro';
  value: number;
  date: string;
  status: 'Pendente' | 'Pago' | 'Atrasado' | 'Concluído';
  reference: string; // e.g., "Ponto 01/2024" or "Fatura #123"
  workId?: string;
  workName?: string;
  retentionPercentage?: number;
  retentionValue?: number;
  netValue?: number;
}

export interface TimeLog {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  photo: string;
  timestamp: string;
  date: string;
  type: 'Entrada' | 'Saída';
  workName: string;
}

export interface Advance {
  id: string;
  value: number;
  date: string;
  description?: string;
}

export interface Contractor {
  id: string;
  name: string;
  service: string;
  laborCost: number;
  totalContractValue: number;
  advances: Advance[];
  startDate?: string;
  status: 'Ativo' | 'Finalizado';
  currentWork: string;
  classification?: 'A' | 'B' | 'C';
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  payType: 'Mensal' | 'Diária' | 'Semanal' | 'Quinzenal';
  payValue: number;
  currentWork: string;
  photo?: string;
  status: 'Ativo' | 'Férias' | 'Afastado';
  startDate?: string;
  classification?: 'A' | 'B' | 'C';
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cpf_cnpj?: string;
  status: 'Ativo' | 'Inativo';
  registrationDate: string;
  observations?: string;
  whatsappPhoto?: string;
}

export interface StageMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  timestamp: string;
  size: string;
}

export interface ProjectStage {
  id: string;
  name: string;
  progress: number;
  status: 'Pendente' | 'Em andamento' | 'Concluído';
  responsible?: string;
  workId: string;
  media: StageMedia[];
  order?: number;
}

export interface TechnicalProject {
  id: string;
  name: string;
  workName: string;
  type: 'DWG' | 'PDF';
  uploadDate: string;
  size: string;
  author: string;
  evaluation?: { rating: number; comment: string; };
  isDownloaded?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  email?: string;
  rating?: number;
}

export interface QuoteItem {
  id: string;
  supplierName: string;
  price: number;
  deliveryTime?: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minStock: number;
  lastRestock: string;
  expirationDate?: string;
  observations?: string;
  bestPriceFound?: number;
  bestSupplierName?: string;
  bestPriceUrl?: string;
  savingsFound?: number;
  workId?: string;
  workName?: string;
  projectId?: string;
  projectName?: string;
  image?: string;
}

export type ProjectPriority = 'Alta' | 'Média' | 'Baixa';

export interface Project {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
  responsible: string;
  progress: number;
  status: 'Em andamento' | 'Concluído' | 'Parado';
  startDate: string;
  priority: ProjectPriority;
  owner?: string;
  projectAuthor?: string;
  technicalResponsible?: string;
  stages?: ProjectStage[];
  suppliers?: Supplier[];
  collaborators?: string[];
  photos?: string[];
}

export interface ScannedQR {
  id: string;
  data: string;
  timestamp: string;
  type: string;
  value?: number;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: View[];
}

export interface Activity {
  id: string;
  description: string;
  time: string;
  type: 'update' | 'alert' | 'success';
}

export interface Proposal {
  id: string;
  contractorId: string;
  contractorName: string;
  serviceType: string;
  unit: string;
  quantity: number;
  proposedPrice: number;
  totalValue: number;
  date: string;
  status: 'Abaixo do Mercado' | 'Dentro da Faixa' | 'Acima do Mercado';
  referenceMin: number;
  referenceMax: number;
  workId?: string;
  workName?: string;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sublabel: string;
  color: string;
  onClick?: () => void;
}

export interface MarketplaceProfessional {
  id: string;
  name: string;
  photo: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  radius: number;
  specialties: string[];
  experience: number;
  description: string;
  portfolio: string[];
  cpf_cnpj?: string;
  certificates?: string[];
  rating: number;
  reviews: MarketplaceReview[];
  password?: string;
  walletBalance: number;
  walletTransactions?: { id: string, amount: number, description: string, date: string, type: 'credit' | 'debit' }[];
  unlockedRequests?: string[];
  notifications?: { id: string, text: string, timestamp: string }[];
  reviewsCount?: number;
}

export interface MarketplaceClient {
  id: string;
  name: string;
  photo: string;
  phone: string;
  email: string;
  city: string;
  workType: 'Reforma de apartamento' | 'Construção' | 'Pequenos reparos' | 'Instalação específica' | 'Acabamentos';
  serviceDescription?: string;
  password?: string;
  notifications?: { id: string, text: string, timestamp: string }[];
  videos?: string[];
}

export interface MarketplaceServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  location: string;
  description: string;
  photos: string[];
  videos?: string[];
  deadline: string;
  budget: number;
  status: 'Aberto' | 'Em Negociação' | 'Concluído' | 'Cancelado';
  createdAt: string;
  hiredProId?: string;
}

export interface MarketplaceReview {
  id: string;
  proId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface MarketplaceChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  requestId?: string;
  text?: string;
  photo?: string;
  quote?: number;
  timestamp: string;
}
