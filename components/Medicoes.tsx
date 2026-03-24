
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ruler, 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock,
  Filter,
  Pencil,
  Trash2,
  X,
  Save,
  ShieldCheck,
  Globe,
  Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Measurement, Project, Payment, View } from '../types';
import ConfirmModal from './ConfirmModal';

const Medicoes: React.FC<{ onNavigate?: (view: View) => void }> = ({ onNavigate }) => {
  const [medicoes, setMedicoes] = useState<Measurement[]>(() => {
    const saved = localStorage.getItem('perfil_medicoes');
    return saved ? JSON.parse(saved) : [];
  });

  const [works] = useState<Project[]>(() => {
    const saved = localStorage.getItem('perfil_works');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; description: string; type: 'single' | 'all' }>({
    isOpen: false,
    id: '',
    description: '',
    type: 'single'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingPrice, setIsSearchingPrice] = useState(false);

  const searchMarketPrice = async () => {
    if (!newMedicao.description) {
      alert("Por favor, descreva o serviço primeiro para que a IA possa pesquisar o valor.");
      return;
    }

    setIsSearchingPrice(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || '') });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pesquise o valor total médio de mercado para o seguinte serviço de construção civil: "${newMedicao.description}". 
        Considere uma obra padrão no Brasil em 2024/2025. 
        Retorne APENAS o valor numérico médio. 
        Exemplo de resposta: 1500.00`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      // Procura o primeiro número no formato 0.000,00 ou 0000.00
      const match = text.match(/\d+([.,]\d+)?/);
      
      if (match) {
        let priceText = match[0].replace(',', '.');
        // Se houver múltiplos pontos (ex: 1.200.50), remove os primeiros
        const parts = priceText.split('.');
        if (parts.length > 2) {
          const decimal = parts.pop();
          priceText = parts.join('') + '.' + decimal;
        }
        
        const price = parseFloat(priceText);

        if (!isNaN(price) && price > 0) {
          setNewMedicao({ ...newMedicao, value: price });
          return;
        }
      }
      
      alert("A IA encontrou informações, mas não conseguiu extrair um valor numérico exato. Por favor, insira manualmente.");
    } catch (error) {
      console.error("Erro na busca de preço:", error);
      alert("Ocorreu um erro ao consultar o mercado. Tente novamente em instantes.");
    } finally {
      setIsSearchingPrice(null as any);
    }
  };
  const [newMedicao, setNewMedicao] = useState<Partial<Measurement>>({
    workId: '',
    workName: '',
    date: new Date().toLocaleDateString('pt-BR'),
    description: '',
    value: 0,
    status: 'Pendente',
    globalValue: 0,
    retentionPercentage: 10
  });

  useEffect(() => {
    localStorage.setItem('perfil_medicoes', JSON.stringify(medicoes));
  }, [medicoes]);

  const handleClearAll = () => {
    setConfirmDelete({
      isOpen: true,
      id: 'all',
      description: 'todas as medições',
      type: 'all'
    });
  };

  const stats = useMemo(() => {
    const pendente = medicoes.filter(m => m.status === 'Pendente').reduce((acc, curr) => acc + curr.value, 0);
    const aprovado = medicoes.filter(m => m.status === 'Aprovado').reduce((acc, curr) => acc + curr.value, 0);
    const pago = medicoes.filter(m => m.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0);
    const totalRetido = medicoes.reduce((acc, curr) => acc + (curr.retentionValue || 0), 0);
    return { pendente, aprovado, pago, totalRetido };
  }, [medicoes]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicao.workName || !newMedicao.value || !newMedicao.description) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const value = Number(newMedicao.value);
    const retentionPercentage = Number(newMedicao.retentionPercentage || 10);
    const retentionValue = (value * retentionPercentage) / 100;
    const netValue = value - retentionValue;

    if (editingId) {
      setMedicoes(medicoes.map(m => m.id === editingId ? {
        ...m,
        workId: newMedicao.workId || m.workId,
        workName: newMedicao.workName || m.workName,
        date: newMedicao.date || m.date,
        description: newMedicao.description || m.description,
        value: value,
        status: newMedicao.status as any,
        globalValue: Number(newMedicao.globalValue),
        retentionPercentage: retentionPercentage,
        retentionValue: retentionValue,
        netValue: netValue
      } : m));
    } else {
      const medicao: Measurement = {
        id: Date.now().toString(),
        workId: newMedicao.workId || 'manual',
        workName: newMedicao.workName!,
        date: newMedicao.date || new Date().toLocaleDateString('pt-BR'),
        description: newMedicao.description!,
        value: value,
        status: newMedicao.status as any,
        globalValue: Number(newMedicao.globalValue),
        retentionPercentage: retentionPercentage,
        retentionValue: retentionValue,
        netValue: netValue
      };
      setMedicoes([medicao, ...medicoes]);
    }

    setIsAdding(false);
    setEditingId(null);
    setNewMedicao({
      workId: '',
      workName: '',
      date: new Date().toLocaleDateString('pt-BR'),
      description: '',
      value: 0,
      status: 'Pendente',
      globalValue: 0,
      retentionPercentage: 10
    });
  };

  const handleStatusChange = (id: string, newStatus: 'Pendente' | 'Aprovado' | 'Pago') => {
    const updated = medicoes.map(m => m.id === id ? { ...m, status: newStatus } : m);
    setMedicoes(updated);

    if (newStatus === 'Pago') {
      const medicao = medicoes.find(m => m.id === id);
      if (medicao) {
        const savedPayments = JSON.parse(localStorage.getItem('perfil_payments') || '[]') as Payment[];
        const newPayment: Payment = {
          id: `med-${medicao.id}`,
          recipientId: medicao.workId,
          recipientName: `Medição: ${medicao.workName}`,
          type: 'Empreiteiro',
          value: medicao.netValue || medicao.value,
          date: new Date().toISOString().split('T')[0],
          status: 'Pago',
          reference: `Medição: ${medicao.description}`,
          workId: medicao.workId,
          workName: medicao.workName
        };
        
        // Avoid duplicates
        const filtered = savedPayments.filter(p => p.id !== newPayment.id);
        localStorage.setItem('perfil_payments', JSON.stringify([...filtered, newPayment]));
        window.dispatchEvent(new Event('storage'));
      }
    }
  };

  const handleEdit = (medicao: Measurement) => {
    setNewMedicao({
      workId: medicao.workId,
      workName: medicao.workName,
      date: medicao.date,
      description: medicao.description,
      value: medicao.value,
      status: medicao.status,
      globalValue: medicao.globalValue || 0,
      retentionPercentage: medicao.retentionPercentage || 10
    });
    setEditingId(medicao.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string, description: string) => {
    setConfirmDelete({ isOpen: true, id, description, type: 'single' });
  };

  const executeDelete = () => {
    if (confirmDelete.type === 'all') {
      setMedicoes([]);
      localStorage.removeItem('perfil_medicoes');
    } else {
      setMedicoes(prev => prev.filter(m => m.id !== confirmDelete.id));
    }
    setConfirmDelete({ isOpen: false, id: '', description: '', type: 'single' });
  };

  const filtered = medicoes.filter(m => 
    m.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Medições</h1>
          <p className="text-slate-500 mt-2 font-medium">Controle de medições de serviços executados</p>
        </div>
        <div className="flex gap-4">
          {onNavigate && (
            <button 
              onClick={() => onNavigate(View.FATURAS)}
              className="px-6 py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              Fatura
            </button>
          )}
          <button 
            onClick={handleClearAll}
            className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all border border-rose-100"
          >
            <Trash2 size={20} />
            Limpar Tudo
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            Nova Medição
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pendente</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-amber-500">
            <Clock size={14} />
            <span className="text-[10px] font-bold uppercase">Aguardando Aprovação</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Aprovado</p>
          <h3 className="text-2xl font-black text-slate-900">R$ {stats.aprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-emerald-500">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-bold uppercase">Pronto para Pagamento</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Retido (10%+)</p>
          <h3 className="text-2xl font-black text-blue-600">R$ {stats.totalRetido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-blue-500">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase">Fundo de Garantia</span>
          </div>
        </div>
        <div className="bg-[#0b1222] p-6 rounded-3xl shadow-xl text-white">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Pago</p>
          <h3 className="text-2xl font-black">R$ {stats.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center gap-1 text-blue-400">
            <DollarSign size={14} />
            <span className="text-[10px] font-bold uppercase">Liquidação Realizada</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por obra ou descrição..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-center gap-2 font-bold text-sm hover:bg-slate-100 transition-all">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Obra</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Bruto</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Retenção</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Líquido</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Building2 size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">{m.workName}</span>
                      {m.globalValue && m.globalValue > 0 && (
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Global: R$ {m.globalValue.toLocaleString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Calendar size={14} />
                    {m.date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-600 text-sm font-medium">{m.description}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-600 text-sm">
                    R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-rose-500 text-sm">
                      - R$ {(m.retentionValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">({m.retentionPercentage || 10}%)</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-emerald-600 text-sm">
                    R$ {(m.netValue || m.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    m.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-600' : 
                    m.status === 'Pago' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {m.status === 'Aprovado' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {m.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {m.status !== 'Pago' && (
                      <button 
                        onClick={() => handleStatusChange(m.id, 'Pago')}
                        className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Marcar como Pago"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleEdit(m)}
                      className="text-amber-500 p-2 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id, m.description)}
                      className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova/Editar Medição */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => {
            setIsAdding(false);
            setEditingId(null);
            setNewMedicao({
              workId: '',
              workName: '',
              date: new Date().toLocaleDateString('pt-BR'),
              description: '',
              value: 0,
              status: 'Pendente'
            });
          }} />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">
                  {editingId ? 'Editar Medição' : 'Nova Medição'}
                </h2>
                <p className="text-blue-400 text-[10px] font-black uppercase mt-2 tracking-widest">
                  {editingId ? 'Atualização de Registro' : 'Lançamento de Serviço Executado'}
                </p>
              </div>
              <button onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setNewMedicao({
                  workId: '',
                  workName: '',
                  date: new Date().toLocaleDateString('pt-BR'),
                  description: '',
                  value: 0,
                  status: 'Pendente'
                });
              }} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Obra</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMedicao.workId}
                    onChange={e => {
                      const w = works.find(work => work.id === e.target.value);
                      setNewMedicao({ ...newMedicao, workId: e.target.value, workName: w?.name || '' });
                    }}
                  >
                    <option value="">Selecionar Obra</option>
                    {works.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                    <option value="manual">Outra (Manual)</option>
                  </select>
                </div>

                {newMedicao.workId === 'manual' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Obra</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newMedicao.workName}
                      onChange={e => setNewMedicao({ ...newMedicao, workName: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor Global do Serviço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMedicao.globalValue}
                    onChange={e => setNewMedicao({ ...newMedicao, globalValue: Number(e.target.value) })}
                    placeholder="Valor total do contrato"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição do Serviço</label>
                  <textarea 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                    placeholder="Ex: Alvenaria do 3º pavimento concluída..."
                    value={newMedicao.description}
                    onChange={e => setNewMedicao({ ...newMedicao, description: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      'Escavação (valas/sapatas/infra)',
                      'Confecção de concreto térreo',
                      'Assentamento de Tijolos simples/dobrado',
                      'Assentamento de portais',
                      'Assentamento de caixinha de tomadas',
                      'Chapisco',
                      'Reboco',
                      'Requádrações (porta/janelas/vigas)',
                      'Confecção de contra piso',
                      'Assentamento de revestimentos (parede/piso)'
                    ].map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setNewMedicao({ ...newMedicao, description: suggestion })}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 rounded-lg text-[9px] font-bold text-slate-600 transition-all border border-slate-200"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor Bruto (R$)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.01"
                        className="flex-1 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newMedicao.value}
                        onChange={e => setNewMedicao({ ...newMedicao, value: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        onClick={searchMarketPrice}
                        disabled={isSearchingPrice}
                        className={`p-4 rounded-2xl transition-all border ${
                          isSearchingPrice 
                            ? 'bg-slate-100 text-slate-400 border-slate-200' 
                            : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white shadow-sm'
                        }`}
                        title="Pesquisar valor de mercado via IA"
                      >
                        {isSearchingPrice ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Globe size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Retenção (%)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newMedicao.retentionPercentage}
                      onChange={e => setNewMedicao({ ...newMedicao, retentionPercentage: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                      onChange={e => {
                        const date = new Date(e.target.value);
                        setNewMedicao({ ...newMedicao, date: date.toLocaleDateString('pt-BR') });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMedicao.status}
                    onChange={e => setNewMedicao({ ...newMedicao, status: e.target.value as any })}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setNewMedicao({
                      workId: '',
                      workName: '',
                      date: new Date().toLocaleDateString('pt-BR'),
                      description: '',
                      value: 0,
                      status: 'Pendente'
                    });
                  }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editingId ? 'Atualizar Medição' : 'Salvar Medição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={confirmDelete.type === 'all' ? "Limpar Tudo" : "Excluir Medição"}
        message={confirmDelete.type === 'all' 
          ? "Deseja apagar todas as medições? Esta ação não pode ser desfeita."
          : `Deseja excluir a medição "${confirmDelete.description}"? Esta ação não pode ser desfeita.`
        }
      />
    </div>
  );
};

export default Medicoes;
