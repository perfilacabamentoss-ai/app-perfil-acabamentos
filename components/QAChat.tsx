
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MessageSquare, MoreVertical, Search, Phone, Video, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface ChatUser {
  id: string;
  name: string;
  role: string;
  photo: string;
  color: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

const FICTITIOUS_USERS: ChatUser[] = [
  {
    id: 'user-1',
    name: 'João Silva',
    role: 'Engenheiro Civil',
    photo: 'https://picsum.photos/seed/joao/100/100',
    color: 'text-blue-500'
  },
  {
    id: 'user-2',
    name: 'Maria Santos',
    role: 'Arquiteta',
    photo: 'https://picsum.photos/seed/maria/100/100',
    color: 'text-purple-500'
  },
  {
    id: 'user-3',
    name: 'Pedro Oliveira',
    role: 'Mestre de Obras',
    photo: 'https://picsum.photos/seed/pedro/100/100',
    color: 'text-emerald-500'
  },
  {
    id: 'user-4',
    name: 'Ana Costa',
    role: 'Cliente',
    photo: 'https://picsum.photos/seed/ana/100/100',
    color: 'text-amber-500'
  }
];

const QAChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('perfil_qa_messages');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        userId: 'user-1',
        userName: 'João Silva',
        text: 'Olá pessoal, como está o andamento da concretagem na laje do 3º andar?',
        timestamp: '09:00',
        status: 'read'
      },
      {
        id: '2',
        userId: 'user-3',
        userName: 'Pedro Oliveira',
        text: 'Bom dia Eng. João. Estamos finalizando a armação, a previsão é iniciar o bombeamento às 14h.',
        timestamp: '09:15',
        status: 'read'
      }
    ];
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    localStorage.setItem('perfil_qa_messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessageAsUser = (user: ChatUser) => {
    const questions = [
      "Qual o prazo para entrega dos revestimentos?",
      "O fornecedor de gesso já confirmou a entrega para amanhã?",
      "Precisamos revisar o detalhamento da escada principal.",
      "Como está a medição da equipe de elétrica?",
      "O cliente solicitou uma alteração no layout da cozinha.",
      "Temos material suficiente para a próxima etapa?",
      "A equipe de pintura inicia quando?",
      "Houve algum imprevisto com a chuva de ontem?"
    ];
    
    const randomText = questions[Math.floor(Math.random() * questions.length)];
    
    const newMessage: Message = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      text: randomText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate delivery and read
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 1000);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
    }, 3000);
  };

  const clearChat = () => {
    setConfirmDelete(true);
  };

  const executeClearChat = () => {
    setMessages([]);
    setConfirmDelete(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-slate-950 overflow-hidden transition-colors">
      {/* WhatsApp Style Header */}
      <header className="bg-[#075e54] dark:bg-slate-900 text-white p-3 flex items-center justify-between shadow-md z-10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            <MessageSquare size={24} />
          </div>
          <div>
            <h1 className="font-bold text-sm">Grupo de Obra - Perfil</h1>
            <p className="text-[10px] opacity-80">João, Maria, Pedro, Ana...</p>
          </div>
        </div>
        <div className="flex items-center gap-4 opacity-80">
          <Video size={20} className="cursor-pointer hover:opacity-100" />
          <Phone size={18} className="cursor-pointer hover:opacity-100" />
          <Search size={20} className="cursor-pointer hover:opacity-100" />
          <button onClick={clearChat} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth relative"
      >
        {/* Background Overlay for Dark Mode */}
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}
        />
        
        <div className="flex justify-center relative z-10">
          <span className="bg-[#d1f4ff] dark:bg-slate-800 text-[#54656f] dark:text-slate-400 text-[11px] px-3 py-1 rounded-lg shadow-sm uppercase font-medium">
            Hoje
          </span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const user = FICTITIOUS_USERS.find(u => u.id === msg.userId);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex flex-col relative z-10"
              >
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm max-w-[85%] self-start relative border border-white dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <img 
                      src={user?.photo} 
                      alt={msg.userName} 
                      className="w-5 h-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className={`text-[11px] font-bold ${user?.color || 'text-slate-600'}`}>
                      {msg.userName}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal ml-auto">
                      {user?.role}
                    </span>
                  </div>
                  <p className="text-sm text-[#111b21] dark:text-slate-200 leading-relaxed pr-12">
                    {msg.text}
                  </p>
                  <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {msg.timestamp}
                    </span>
                    {msg.status === 'sent' && <Check size={12} className="text-slate-400 dark:text-slate-600" />}
                    {msg.status === 'delivered' && <CheckCheck size={12} className="text-slate-400 dark:text-slate-600" />}
                    {msg.status === 'read' && <CheckCheck size={12} className="text-blue-500 dark:text-blue-400" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom Controls - User Selection */}
      <div className="bg-[#f0f2f5] dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 text-center">
          Gerar Pergunta como Usuário:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FICTITIOUS_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => sendMessageAsUser(user)}
              className="flex flex-col items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all group"
            >
              <div className="relative">
                <img 
                  src={user.photo} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-amber-500 transition-colors"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{user.name}</p>
                <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{user.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area (Mock) */}
      <div className="bg-[#f0f2f5] dark:bg-slate-900 px-4 pb-4 pt-2 flex items-center gap-2 transition-colors">
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-full px-4 py-2 text-sm text-slate-400 flex items-center justify-between border border-slate-200 dark:border-slate-700">
          <span>Digite uma mensagem...</span>
          <div className="flex gap-3">
            <span className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">📎</span>
            <span className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">📷</span>
          </div>
        </div>
        <button className="bg-[#00a884] dark:bg-emerald-600 text-white p-3 rounded-full shadow-md hover:bg-[#008f6f] dark:hover:bg-emerald-700 transition-colors">
          <Send size={20} />
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={executeClearChat}
        title="Limpar Histórico"
        message="Deseja limpar todo o histórico de mensagens? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default QAChat;
