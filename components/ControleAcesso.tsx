
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  X,
  Lock,
  Eye,
  EyeOff,
  UserCog
} from 'lucide-react';
import { View, UserRole } from '../types';
import ConfirmModal from './ConfirmModal';

const ControleAcesso: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
  const [roles, setRoles] = useState<UserRole[]>(() => {
    const saved = localStorage.getItem('perfil_user_roles');
    return saved ? JSON.parse(saved) : [
      { id: 'admin', name: 'Administrador', permissions: Object.values(View) },
      { id: 'mestre', name: 'Mestre de Obras', permissions: [View.DASHBOARD, View.OBRAS, View.ETAPAS, View.PRODUCAO] },
      { id: 'financeiro', name: 'Financeiro', permissions: [View.DASHBOARD, View.PAGAMENTOS, View.FATURAS, View.MEDICOES] }
    ];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; roleId: string; roleName: string }>({
    isOpen: false,
    roleId: '',
    roleName: '',
  });

  useEffect(() => {
    localStorage.setItem('perfil_user_roles', JSON.stringify(roles));
  }, [roles]);

  const togglePermission = (roleId: string, view: View) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.includes(view);
        const newPermissions = hasPermission 
          ? role.permissions.filter(p => p !== view)
          : [...role.permissions, view];
        return { ...role, permissions: newPermissions };
      }
      return role;
    }));
  };

  const addRole = () => {
    if (!newRoleName) return;
    const newRole: UserRole = {
      id: Math.random().toString(36).substr(2, 9),
      name: newRoleName,
      permissions: [View.DASHBOARD]
    };
    setRoles([...roles, newRole]);
    setNewRoleName('');
    setIsAdding(false);
  };

  const deleteRole = (id: string) => {
    if (id === 'admin') {
      alert("O perfil Administrador não pode ser removido.");
      return;
    }
    const role = roles.find(r => r.id === id);
    if (role) {
      setConfirmDelete({
        isOpen: true,
        roleId: id,
        roleName: role.name,
      });
    }
  };

  const executeDeleteRole = () => {
    setRoles(prev => prev.filter(r => r.id !== confirmDelete.roleId));
    setConfirmDelete({ isOpen: false, roleId: '', roleName: '' });
  };

  const viewLabels: Record<View, string> = {
    [View.DASHBOARD]: 'Dashboard',
    [View.OBRAS]: 'Obras',
    [View.PROJETOS]: 'Projetos',
    [View.ETAPAS]: 'Etapas',
    [View.FORNECEDORES]: 'Fornecedores',
    [View.EMPREITEIROS]: 'Empreiteiros',
    [View.COLABORADORES]: 'Colaboradores',
    [View.PONTO]: 'Ponto Facial',
    [View.MATERIAIS]: 'Materiais',
    [View.MEDICOES]: 'Medições',
    [View.FATURAS]: 'Faturas',
    [View.PAGAMENTOS]: 'Pagamentos',
    [View.CLIENTES]: 'Registro de Clientes',
    [View.PRODUCAO]: 'Produção Diária',
    [View.PEDIDOS]: 'Pedidos',
    [View.CALCULADORAS]: 'Calculadoras',
    [View.YOUTUBE]: 'Canal YouTube',
    [View.AUTONOMO]: 'Regulamento Autônomo',
    [View.CONTROLE_ACESSO]: 'Controle de Acesso',
    [View.CONFIGURACOES]: 'Configurações',
    [View.LEITURA_PROJETOS]: 'IA Leitora de Projetos',
    [View.TUTORIAL]: 'Vídeo Tutorial',
    [View.PROPOSTAS]: 'Propostas de Serviço',
    [View.PLANEJAMENTO_ESTRATEGICO]: 'Planejamento Estratégico',
    [View.COLABORADOR_PORTAL]: 'Portal do Colaborador',
    [View.QA_CHAT]: 'Perguntas & Respostas',
    [View.DECOR]: 'Reforma / Decorações',
    [View.PROFISSIONAIS]: 'Profissionais'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Controle de Acesso</h1>
          <p className="text-slate-500 mt-2 font-medium">Determine quem pode visualizar cada tela do sistema</p>
        </div>
        {!readOnly && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            Novo Perfil
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest border-r border-slate-800 sticky left-0 bg-slate-900 z-10 min-w-[200px]">
                  Perfil / Tela
                </th>
                {Object.values(View).map(view => (
                  <th key={view} className="px-4 py-6 text-[9px] font-black uppercase tracking-widest text-center min-w-[100px] border-r border-slate-800">
                    {viewLabels[view]}
                  </th>
                ))}
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <UserCog size={16} />
                      </div>
                      <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{role.name}</span>
                    </div>
                  </td>
                  {Object.values(View).map(view => (
                    <td key={view} className="px-4 py-6 text-center border-r border-slate-100">
                      <button 
                        onClick={() => !readOnly && role.id !== 'admin' && togglePermission(role.id, view)}
                        disabled={readOnly || role.id === 'admin'}
                        className={`p-2 rounded-xl transition-all ${
                          role.permissions.includes(view) 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-slate-50 text-slate-300'
                        } ${!readOnly && role.id !== 'admin' ? 'hover:scale-110' : 'cursor-default opacity-50'}`}
                      >
                        {role.permissions.includes(view) ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </td>
                  ))}
                  <td className="px-8 py-6 text-right">
                    {!readOnly && role.id !== 'admin' && (
                      <button 
                        onClick={() => deleteRole(role.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 bg-blue-50 border-2 border-dashed border-blue-100 rounded-[2.5rem] flex items-center gap-6">
        <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
          <Lock size={32} />
        </div>
        <div>
          <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Segurança de Dados</h3>
          <p className="text-sm text-blue-700 font-medium mt-1">
            As permissões definidas aqui restringem o acesso às funcionalidades tanto no menu lateral quanto na navegação direta. 
            O perfil <span className="font-black">Administrador</span> sempre terá acesso total.
          </p>
        </div>
      </div>

      {/* New Role Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAdding(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#0b1222] text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Novo Perfil</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Controle de Acesso</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Perfil</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ex: Almoxarife, Estagiário..."
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRole()}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={addRole}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Criar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={executeDeleteRole}
        title="Remover Perfil"
        message={`Deseja remover o perfil de acesso "${confirmDelete.roleName}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default ControleAcesso;
