
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CameraOff, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;

        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        // Get available cameras to allow switching if needed
        const devices = await Html5Qrcode.getCameras();
        setCameras(devices);

        // Try to find a back camera explicitly
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('traseira') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );

        const cameraToUse = backCamera ? backCamera.id : { facingMode: "environment" };

        await html5QrCode.start(
          cameraToUse, 
          config,
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScanner();
          },
          (errorMessage) => {}
        );
        
        setIsInitializing(false);
      } catch (err: any) {
        console.error("Erro ao iniciar scanner:", err);
        setError(err.message || "Não foi possível acessar a câmera. Verifique as permissões.");
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScanSuccess]);

  const switchCamera = async () => {
    if (!html5QrCodeRef.current || cameras.length < 2) return;
    
    setIsInitializing(true);
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    try {
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      await html5QrCodeRef.current.start(
        cameras[nextIndex].id,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanner();
        },
        () => {}
      );
      setIsInitializing(false);
    } catch (err) {
      console.error("Erro ao trocar câmera:", err);
      setError("Erro ao trocar de câmera.");
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 bg-[#0b1222] text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase leading-none">Scanner QR Code</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase mt-2 tracking-widest">Leitura de Notas e Pagamentos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8">
          <div className="relative aspect-square bg-slate-100 rounded-2xl border-2 border-slate-200 overflow-hidden flex items-center justify-center">
            <div id="qr-reader" className="w-full h-full" />
            
            {isInitializing && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Iniciando Câmera...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-6 text-center gap-4">
                <div className="p-4 bg-rose-100 text-rose-500 rounded-full">
                  <CameraOff size={32} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Erro de Acesso</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{error}</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200"
                >
                  Recarregar Página
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 items-center">
            {cameras.length > 1 && (
              <button 
                onClick={switchCamera}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <RefreshCw size={14} className={isInitializing ? 'animate-spin' : ''} />
                Trocar Câmera
              </button>
            )}
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              {!error ? "Aponte a câmera traseira para o QR Code" : "A câmera precisa de permissão para funcionar"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
