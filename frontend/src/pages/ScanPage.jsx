import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Footer from '../components/Footer';

const ScanPage = () => {
  const { user } = useAuth();
  const [activeMethod, setActiveMethod] = useState('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const loadingToast = toast.loading('Extracting Clinical Data...');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post(`${API_URL}/api/extract-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success && res.data.text) {
        const rawText = res.data.text.trim();
        
        // Intelligent parsing for NVIDIA Vision output format
        let extractedProduct = 'Image Extraction';
        let extractedIngredients = rawText;

        const productMatch = rawText.match(/Product:\s*(.+)/i);
        const ingredientsMatch = rawText.match(/Ingredients:\s*(.+)/is);

        if (productMatch) extractedProduct = productMatch[1].split('\n')[0].trim();
        if (ingredientsMatch) extractedIngredients = ingredientsMatch[1].trim();

        setProductName(extractedProduct);
        setIngredients(extractedIngredients);
        setActiveMethod('manual');
        toast.success(`Detected: ${extractedProduct}`, {
          id: loadingToast,
          style: {
            background: '#005144',
            color: '#fff',
            fontWeight: 600,
            borderRadius: '16px',
          }
        });
      }
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('Image analysis protocol failed. Please manual entry.', { id: loadingToast });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIngredients(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
        toast.success('Stream captured.', {
          style: {
            background: '#005144',
            color: '#fff',
            fontWeight: 600,
            borderRadius: '16px',
          }
        });
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice capture interrupted.');
      };

      setRecognition(rec);
    }
  }, []);

  const handleVoiceInput = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
        setIsListening(true);
      }
    } else {
      toast.error('Voice protocol unsupported.');
    }
  };

  const handleScan = async (type, content) => {
    setIsAnalyzing(true);
    const analysisToast = toast.loading('Initializing Analysis Pipeline...');
    try {
      const trimmedProduct = productName.trim() || "Clinical Sample";
      const trimmedIngredients = ingredients.trim() || "Molecular scan data";

      const payload = {
        type,
        content: type === 'text' ? `Product: ${trimmedProduct}. Ingredients: ${trimmedIngredients}` : content,
        userId: user?.id || 'GUEST'
      };

      const res = await axios.post(`${API_URL}/api/scans`, payload);

      if (res.data.success) {
        toast.success(`Analysis ready for ${trimmedProduct}`, {
          id: analysisToast,
          style: {
            background: '#005144',
            color: '#fff',
            fontWeight: 600,
            borderRadius: '16px',
          }
        });
        navigate(`/analysis/${res.data.scanId}`, {
          state: {
            analysis: res.data.analysis,
            productName: trimmedProduct,
            inputQuery: type === 'text' ? `${trimmedProduct} — ${trimmedIngredients}` : content,
            isGuest: !user
          }
        });
      }
    } catch (err) {
      console.error("Analysis Error:", err);
      toast.error('Clinical Pipeline Failure. Check network connection.', { id: analysisToast });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const methods = [
    { id: 'upload', label: 'Image Upload', icon: <span className="material-symbols-outlined text-[18px]">upload_file</span> },
    { id: 'manual', label: 'Manual Entry', icon: <span className="material-symbols-outlined text-[18px]">edit</span> },
    { id: 'voice', label: 'Voice', icon: <span className="material-symbols-outlined text-[18px]">mic</span> }
  ];


  return (
    <div className="min-h-screen bg-surface font-body text-on-surface selection:bg-primary-fixed-dim" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', position: 'relative', overscrollBehaviorX: 'none' }}>

      <main className="pt-20 md:pt-24 pb-32 px-4 max-w-5xl mx-auto min-h-screen">
        {/* Header Section */}
        <header className="mb-8 md:mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-[12px]">security</span> Encrypted Lab Input
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-on-surface tracking-tight mb-2">Scan Lab</h1>
          <p className="text-on-surface-variant text-base md:text-lg max-w-xl">Capture medical data with high precision. Choose your preferred input method.</p>
        </header>

        {/* Main Bento Container */}
        <div className="bg-surface-container-low rounded-[2rem] p-4 md:p-8 mb-8 border border-white/40">
          {/* Method Switcher (Tabs) */}
          <div className="flex flex-row overflow-x-auto no-scrollbar gap-2 mb-8 p-1.5 bg-surface-container rounded-2xl sm:rounded-3xl w-full max-w-2xl mx-auto shadow-inner">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setActiveMethod(method.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl sm:rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all duration-300 whitespace-nowrap ${activeMethod === method.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : 'text-on-surface-variant hover:bg-white/50'
                  }`}
              >
                {method.icon}
                {method.label}
              </button>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMethod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-[2rem] bg-on-surface min-h-[380px] md:min-h-0 md:aspect-[21/9] group"
              >
                <img
                  className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-110 transition-transform duration-[2000ms]"
                  src="/images/botanical.png"
                  alt="lab environment"
                />

                {activeMethod === 'upload' && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 text-center text-white cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-[40px] text-secondary-fixed-dim">upload_file</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Drop Clinical Scans</h3>
                    <p className="opacity-60 text-sm max-w-xs">Supports PDF, JPG, PNG. Tap here to Upload Sample.</p>
                  </div>
                )}

                {activeMethod === 'manual' && (
                  <div className="relative md:absolute inset-0 p-6 md:p-8 flex flex-col justify-center max-w-2xl mx-auto gap-4 z-10">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Product Name</label>
                      <input
                        className="w-full bg-black/40 backdrop-blur-md rounded-xl p-4 text-white border border-white/10 focus:ring-2 focus:ring-primary placeholder:text-white/20"
                        placeholder="e.g. Organic Almond Milk"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Product Ingredients</label>
                      <textarea
                        className="w-full bg-black/40 backdrop-blur-md rounded-2xl p-6 text-white border border-white/10 focus:ring-2 focus:ring-primary h-32 md:h-32 resize-none placeholder:text-white/20 font-mono text-sm"
                        placeholder="Paste the ingredient list or nutritional facts..."
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                      />
                    </div>
                    <button
                      disabled={!productName && !ingredients}
                      onClick={() => handleScan('text', `PRODUCT: ${productName} | INGREDIENTS: ${ingredients}`)}
                      className="bg-primary text-on-primary font-black py-5 rounded-2xl shadow-2xl hover:opacity-90 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      Execute Clinical Analysis <span className="material-symbols-outlined text-[14px]">bolt</span>
                    </button>
                  </div>
                )}

                {activeMethod === 'voice' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="flex items-end gap-1.5 h-12 mb-8">
                      {[...Array(16)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isListening ? [8, 32, 12] : 8 }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
                          className="w-1 bg-secondary-fixed-dim rounded-full"
                        />
                      ))}
                    </div>

                    <div className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8 min-h-[100px] flex flex-col justify-center">
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Transcription Stream</p>
                      <p className="text-white text-sm italic">
                        {ingredients || (isListening ? "Listening for ingredient data..." : "Awaiting clinical voice input...")}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleVoiceInput}
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all ${isListening ? 'bg-error animate-pulse scale-110' : 'bg-primary'}`}
                      >
                        <span className="material-symbols-outlined text-[24px]">{isListening ? 'stop' : 'mic'}</span>
                      </button>

                      {ingredients && !isListening && (
                        <button
                          onClick={() => handleScan('voice', ingredients)}
                          className="bg-secondary-fixed-dim text-primary-deep font-black px-8 py-4 rounded-full text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                        >
                          Analyze Stream <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        </button>
                      )}
                    </div>

                    <p className="mt-6 text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">
                      Speech-to-Text Clinical Engine v2.4
                    </p>
                  </div>
                )}

                {/* Loading Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center text-center px-12">
                    <div className="w-24 h-24 relative mb-12">
                      <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-primary animate-spin"></div>
                      <div className="absolute inset-4 rounded-full border-4 border-white/5 border-b-secondary-fixed-dim animate-spin duration-[3000ms]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-4xl animate-pulse">auto_awesome</span>
                      </div>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Orchestrating AI Pipeline</h2>
                    <p className="text-white/40 max-w-md text-sm leading-relaxed uppercase tracking-[0.3em] font-medium animate-pulse">
                      9 Clinical Agents analyzing ingredients, drug interactions, and medical history in real-time...
                    </p>
                    <div className="mt-8 flex gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}

                {/* Viewfinder Controls */}
                <div className="absolute bottom-6 right-6 flex gap-3">
                  <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/10">
                    <span className="material-symbols-outlined text-[20px]">flashlight_on</span>
                  </button>
                  <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/10">
                    <span className="material-symbols-outlined text-[20px]">rotate_left</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Secondary Sections: Bento Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Scans */}
          <div className="bg-surface-container-low rounded-[2rem] p-8 border border-white/40 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-on-surface text-lg md:text-xl tracking-tight">Recent Logs</h3>
              <Link to="/history" className="text-[10px] font-black tracking-widest text-primary uppercase border-b border-primary/20 pb-1 cursor-pointer hover:text-emerald-900 transition-colors">History View</Link>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Amoxicillin 500mg', time: '2h ago', id: '882', status: 'Verified', color: 'emerald', icon: <span className="material-symbols-outlined text-[20px]">stethoscope</span> },
                { name: 'Laboratory Results', time: 'Yesterday', id: 'LAB-9', status: 'Processed', color: 'blue', icon: <span className="material-symbols-outlined text-[20px]">biotech</span> }
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-container hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-${log.color}-50 flex items-center justify-center text-${log.color}-700 group-hover:scale-110 transition-transform`}>
                      {log.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">{log.name}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium opacity-60">Scanned {log.time} • ID: {log.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 bg-${log.color}-50 text-${log.color}-700 text-[10px] font-black rounded-full uppercase tracking-widest`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Intelligence Insight */}
          <div className="bg-primary text-on-primary rounded-[2rem] p-10 relative overflow-hidden shadow-2xl group">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim">bolt</span>
                  </span>
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">AI Clinical Intelligence</span>
                </div>
                <h4 className="text-2xl md:text-3xl font-black mb-4 tracking-tighter leading-[1.1]">Handwriting Recognition.</h4>
                <p className="text-primary-fixed/60 text-xs md:text-sm leading-relaxed font-medium">Capture doctor prescriptions directly. Our engine extracts dosage, frequency, and chemical safety markers instantly.</p>
              </div>
              <button className="mt-10 w-full md:w-fit bg-secondary-fixed-dim text-primary-deep font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl">
                Upgrade Protocol
              </button>
            </div>
            {/* Aesthetic Background Shapes */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-[3000ms]"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-48 h-48 bg-secondary/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ScanPage;

