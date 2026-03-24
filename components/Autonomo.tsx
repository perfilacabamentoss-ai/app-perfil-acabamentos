
import React from 'react';
import { FileText, AlertCircle, Scale, ShieldCheck, Info, Clock, ExternalLink } from 'lucide-react';

const Autonomo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-[#0b1222] rounded-[2.5rem] p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Scale size={180} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/30 border border-blue-500/30 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <ShieldCheck size={14} />
            Regulamento Oficial
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none mb-4">
            Trabalhador <span className="text-blue-500">Autônomo</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl text-lg">
            Diretrizes e bases regulatórias para a contratação e remuneração de serviços particulares na construção civil.
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-3xl p-6 flex items-start gap-4">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="font-black text-amber-900 uppercase tracking-tight text-sm">Aviso Importante</h4>
          <p className="text-amber-800 text-sm font-medium mt-1 leading-relaxed">
            Este regulamento deve ser alterado assim que forem publicadas novas alterações pelos órgãos competentes. A base de cálculo e os direitos aqui listados são referenciais e devem seguir a legislação vigente.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Remuneração */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Base de Pagamento</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor por Serviço</p>
              <p className="text-slate-700 text-sm font-medium leading-relaxed">
                O pagamento deve ser acordado previamente, podendo ser por **empreitada** (obra fechada) ou **diária**. Recomenda-se o uso de contratos de prestação de serviços.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encargos e Impostos</p>
              <p className="text-slate-700 text-sm font-medium leading-relaxed">
                O trabalhador autônomo é responsável pelo seu próprio recolhimento de INSS e ISS, salvo quando houver retenção na fonte prevista em lei.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Direitos */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Scale size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Direitos e Deveres</h3>
          </div>
          <ul className="space-y-3">
            {[
              'Liberdade de horário e execução.',
              'Ausência de subordinação direta.',
              'Fornecimento de ferramentas próprias (salvo acordo).',
              'Responsabilidade técnica pelo serviço executado.',
              'Direito ao recebimento integral conforme contrato.'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Guidelines */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <Info size={24} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Orientações Detalhadas</h3>
        </div>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              1. Jornada e Prazos
            </h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              Diferente do funcionário CLT, o autônomo não cumpre carga horária fixa imposta pelo contratante. O foco deve ser o **prazo de entrega** estipulado para a etapa ou serviço. Atrasos devem ser comunicados com antecedência e podem gerar multas contratuais.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500" />
              2. Segurança do Trabalho (EPIs)
            </h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              Mesmo sendo autônomo, a segurança dentro do canteiro de obras é responsabilidade compartilhada. O contratante deve exigir o uso de EPIs básicos e o autônomo deve zelar por sua integridade física e de terceiros.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
              <ExternalLink size={18} className="text-blue-500" />
              3. Órgãos Competentes
            </h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              Consulte sempre o **Sindicato da Construção Civil (SINDUSCON)** e o **Ministério do Trabalho** para atualizações sobre tabelas de preços e normas regulamentadoras (NRs). Este documento serve como base administrativa interna para a Perfil Acabamentos.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Atualização</p>
            <p className="text-sm font-bold text-slate-600">Março de 2026</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
          >
            <FileText size={16} />
            Imprimir Regulamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default Autonomo;
