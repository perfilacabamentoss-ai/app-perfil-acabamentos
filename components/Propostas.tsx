
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  HardHat,
  Calendar,
  DollarSign,
  Info,
  ArrowRight,
  ChevronRight,
  X,
  Building2,
  Briefcase
} from 'lucide-react';
import { Proposal, Contractor, Project } from '../types';

export const PRICE_REFERENCE_2026 = [
  { service: 'Diária Oficial/Pedreiro', unit: 'Dia (8h)', min: 180, max: 380 },
  { service: 'Diária Ajudante/Servente', unit: 'Dia (8h)', min: 120, max: 200 },
  { service: 'Alvenaria (Paredes)', unit: 'm²', min: 90, max: 150 },
  { service: 'Assentamento Porcelanato', unit: 'm²', min: 60, max: 100 },
  { service: 'Reboco Interno', unit: 'm²', min: 35, max: 60 },
  { service: 'Reboco Externo/Fachada', unit: 'm²', min: 45, max: 75 },
  { service: 'Chapisco + Reboco', unit: 'm²', min: 55, max: 90 },
  { service: 'Piso Cerâmico', unit: 'm²', min: 40, max: 70 },
  { service: 'Chapiscagem', unit: 'm²', min: 20, max: 30 },
];

const Propostas: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>(() => {
    const saved = localStorage.getItem('perfil_proposals');
    return saved ? JSON.parse(saved) : [];
  });
  const [contractors, setContractors] = useState<Contractor[]>(() => {
    const saved = localStorage.getItem('perfil_contractors');
    return saved ? JSON.parse(saved) : [];
  });
  const [works, setWorks] = useState<Project[]>(() => {
    const saved = localStorage.getItem('perfil_works');
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    contractorId: '',
    serviceType: PRICE_REFERENCE_2026[0].service,
    quantity: '',
    proposedPrice: '',
    workId: ''
  });

  useEffect(() => {
    const handleStorage = () => {
      const p = localStorage.getItem('perfil_proposals');
      if (p) setProposals(JSON.parse(p));
      const c = localStorage.getItem('perfil_contractors');
      if (c) setContractors(JSON.parse(c));
      const w = localStorage.getItem('perfil_works');
      if (w) setWorks(JSON.parse(w));
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('perfil_sync_complete', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('perfil_sync_complete', handleStorage);
    };
  }, []);

  const saveProposals = (newProposals: Proposal[]) => {
    setProposals(newProposals);
    localStorage.setItem('perfil_proposals', JSON.stringify(newProposals));
    window.dispatchEvent(new Event('storage'));
  };

  const selectedRef = useMemo(() => 
    PRICE_REFERENCE_2026.find(r => r.service === formData.serviceType) || PRICE_REFERENCE_2026[0]
  , [formData.serviceType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contractor = contractors.find(c => c.id === formData.contractorId);
    const work = works.find(w => w.id === formData.workId);
    const price = Number(formData.proposedPrice);
    
    let status: Proposal['status'] = 'Dentro da Faixa';
    if (price < selectedRef.min) status = 'Abaixo do Mercado';
    if (price > selectedRef.max) status = 'Acima do Mercado';

    const isDaily = selectedRef.unit.includes('Dia');
    const qty = Number(formData.quantity);
    
    const newProposal: Proposal = {
      id: Math.random().toString(36).substr(2, 9),
      contractorId: formData.contractorId,
      contractorName: contractor?.name || 'Desconhecido',
      serviceType: formData.serviceType,
      unit: selectedRef.unit,
      quantity: qty,
      proposedPrice: price,
      totalValue: isDaily ? qty * 8 : qty * price,
      date: new Date().toISOString().split('T')[0],
      status,
      referenceMin: selectedRef.min,
      referenceMax: selectedRef.max,
      workId: formData.workId,
      workName: work?.name
    };

    saveProposals([newProposal, ...proposals]);
    setShowForm(false);
    setFormData({
      contractorId: '',
      serviceType: PRICE_REFERENCE_2026[0].service,
      quantity: '',
      proposedPrice: '',
      workId: ''
    });
  };

  const deleteProposal = (id: string) => {
    if (confirm('Deseja excluir esta proposta?')) {
      const updated = proposals.filter(p => p.id !== id);
      saveProposals(updated);
    }
  };

  const filteredProposals = proposals.filter(p => 
    p.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.workName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Propostas de Serviço</h1>
          <p className="text-slate-500 mt-2 font-medium">Análise comparativa de orçamentos com base na Tabela 2026</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Nova Proposta
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Propostas</p>
              <p className="text-2xl font-black text-slate-900">{proposals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dentro da Faixa</p>
              <p className="text-2xl font-black text-emerald-600">
                {proposals.filter(p => p.status === 'Dentro da Faixa').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acima do Mercado</p>
              <p className="text-2xl font-black text-rose-600">
                {proposals.filter(p => p.status === 'Acima do Mercado').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="BUSCAR POR EMPREITEIRO OU SERVIÇO..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white focus:border-blue-500 transition-all uppercase tracking-widest"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Proposals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProposals.length > 0 ? (
          filteredProposals.map((proposal) => (
            <div key={proposal.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-all">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <HardHat size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{proposal.contractorName}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Calendar size={12} />
                        {new Date(proposal.date).toLocaleDateString('pt-BR')}
                        {proposal.workName && (
                          <>
                            <span className="mx-1">•</span>
                            <Building2 size={12} />
                            {proposal.workName}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteProposal(proposal.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviço</p>
                    <p className="text-xs font-bold text-slate-700 uppercase">{proposal.serviceType}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">{proposal.quantity} {proposal.unit}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                    <p className="text-lg font-black text-slate-900">
                      {proposal.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>

                {/* Comparison Analysis */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  proposal.status === 'Dentro da Faixa' ? 'bg-emerald-50 border-emerald-100' :
                  proposal.status === 'Abaixo do Mercado' ? 'bg-blue-50 border-blue-100' :
                  'bg-rose-50 border-rose-100'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      proposal.status === 'Dentro da Faixa' ? 'bg-emerald-500 text-white' :
                      proposal.status === 'Abaixo do Mercado' ? 'bg-blue-500 text-white' :
                      'bg-rose-500 text-white'
                    }`}>
                      {proposal.status === 'Dentro da Faixa' && <CheckCircle2 size={20} />}
                      {proposal.status === 'Abaixo do Mercado' && <TrendingDown size={20} />}
                      {proposal.status === 'Acima do Mercado' && <TrendingUp size={20} />}
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${
                        proposal.status === 'Dentro da Faixa' ? 'text-emerald-700' :
                        proposal.status === 'Abaixo do Mercado' ? 'text-blue-700' :
                        'text-rose-700'
                      }`}>
                        {proposal.status}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        Ref: {proposal.referenceMin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - {proposal.referenceMax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Unit.</p>
                    <p className={`text-sm font-black ${
                      proposal.status === 'Dentro da Faixa' ? 'text-emerald-600' :
                      proposal.status === 'Abaixo do Mercado' ? 'text-blue-600' :
                      'text-rose-600'
                    }`}>
                      {proposal.proposedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-2 py-20 bg-white rounded-[2.5rem] border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nenhuma Proposta Encontrada</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto font-medium">Cadastre orçamentos de empreiteiros para comparar com a tabela de referência 2026.</p>
            <button 
              onClick={() => setShowForm(true)}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
              Criar Primeira Proposta
            </button>
          </div>
        )}
      </div>

      {/* New Proposal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Nova Proposta</h2>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Análise de viabilidade financeira</p>
                </div>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empreiteiro</label>
                  <div className="relative">
                    <HardHat className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none"
                      value={formData.contractorId}
                      onChange={e => setFormData({...formData, contractorId: e.target.value})}
                    >
                      <option value="">Selecionar Empreiteiro</option>
                      {contractors.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Obra (Opcional)</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none"
                      value={formData.workId}
                      onChange={e => setFormData({...formData, workId: e.target.value})}
                    >
                      <option value="">Selecionar Obra</option>
                      {works.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Serviço</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none"
                      value={formData.serviceType}
                      onChange={e => setFormData({...formData, serviceType: e.target.value})}
                    >
                      {PRICE_REFERENCE_2026.map(r => (
                        <option key={r.service} value={r.service}>{r.service}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade ({selectedRef.unit})</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                  />
                  {selectedRef.unit.includes('Dia') && (
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight mt-1 ml-1">
                      Calculado: Preço / 8h (Valor da Hora)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Unitário Proposto (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      required
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      value={formData.proposedPrice}
                      onChange={e => {
                        const price = e.target.value;
                        const isDaily = selectedRef.unit.includes('Dia');
                        const qty = (isDaily && price) ? (Number(price) / 8).toFixed(2) : formData.quantity;
                        setFormData({...formData, proposedPrice: price, quantity: qty});
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <div className="w-full p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Info size={14} className="text-blue-600" />
                      <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Referência 2026</span>
                    </div>
                    <p className="text-xs font-bold text-blue-700">
                      {selectedRef.min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - {selectedRef.max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3"
                >
                  Salvar Proposta
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Propostas;
