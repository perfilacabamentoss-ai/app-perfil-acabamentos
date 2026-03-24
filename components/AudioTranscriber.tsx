
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Loader2, 
  MessageSquare, 
  Volume2,
  Trash2,
  FileText
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: "Transcreva este áudio de forma precisa para texto em português brasileiro. Retorne apenas a transcrição." },
                {
                  inlineData: {
                    mimeType: "audio/webm",
                    data: base64Audio
                  }
                }
              ]
            }
          ]
        });

        setTranscription(response.text || 'Não foi possível transcrever o áudio.');
        setIsTranscribing(false);
      };
    } catch (err) {
      console.error("Erro na transcrição:", err);
      setTranscription("Erro ao processar áudio.");
      setIsTranscribing(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-700">
      <div className="p-8 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <Mic size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Notas de Voz</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Transcrição Inteligente Gemini</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/30 relative overflow-hidden">
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 bg-blue-500/10 rounded-full animate-ping" />
              <div className="w-48 h-48 bg-blue-500/20 rounded-full animate-pulse absolute" />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center gap-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                isRecording 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 scale-110' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {isRecording ? <Square className="text-white fill-white" size={32} /> : <Mic className="text-white" size={32} />}
            </button>
            <span className={`text-xs font-black uppercase tracking-[0.3em] ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
              {isRecording ? 'Gravando Áudio...' : 'Toque para Gravar'}
            </span>
          </div>
        </div>

        {audioBlob && !isRecording && (
          <div className="flex items-center justify-center gap-4 animate-in zoom-in duration-300">
            <button
              onClick={transcribeAudio}
              disabled={isTranscribing}
              className="px-8 py-4 bg-[#0b1222] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isTranscribing ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
              {isTranscribing ? 'Processando...' : 'Transcrever Nota'}
            </button>
            <button
              onClick={() => { setAudioBlob(null); setTranscription(''); }}
              className="p-4 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}

        {transcription && (
          <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-blue-600" />
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Resultado da Transcrição</span>
            </div>
            <p className="text-slate-800 font-medium leading-relaxed italic">
              "{transcription}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTranscriber;
