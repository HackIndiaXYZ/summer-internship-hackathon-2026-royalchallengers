import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../config';

const ReportLoadingPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState({
    step: 1,
    label: 'Initializing Clinical Pipeline...',
    complete: false,
    error: null
  });

  useEffect(() => {
    let pollInterval;
    const pollStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/scan/status/${scanId}`);
        const data = res.data;

        setStatus(data);

        if (data.complete) {
          clearInterval(pollInterval);
          if (data.error) return;

          // Fetch final result
          const resultRes = await axios.get(`${API_URL}/api/scan/result/${scanId}`);
          const finalData = resultRes.data.data;

          // Hydrate Storage for refresh resilience
          localStorage.setItem(`scan_session_${scanId}`, JSON.stringify({
            analysis_result: finalData.analysis,
            product_name: finalData.productName,
            input_image: finalData.imageUrl,
            id: scanId
          }));

          // Small delay for UX transition
          setTimeout(() => {
            navigate(`/analysis/${scanId}`, {
              state: {
                analysis: finalData.analysis,
                productName: finalData.productName,
                imageUrl: finalData.imageUrl,
                isGuest: location.state?.isGuest
              },
              replace: true
            });
          }, 1500);
        }
      } catch (err) {
        console.error('Polling Error:', err);
      }
    };

    pollInterval = setInterval(pollStatus, 2000);
    pollStatus(); // Initial call

    return () => clearInterval(pollInterval);
  }, [scanId, navigate, location.state]);

  const progressSteps = [
    { id: 1, label: 'Profile' },
    { id: 2, label: 'Vision' },
    { id: 4, label: 'Audit' },
    { id: 7, label: 'Synthesis' },
    { id: 8, label: 'Verdict' },
    { id: 9, label: 'Finalizing' }
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        {/* Animated Icon */}
        <div className="w-32 h-32 relative mx-auto mb-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-dashed border-primary/20"
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-4 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40"
          >
            <span className="material-symbols-outlined text-white text-4xl">clinical_notes</span>
          </motion.div>
        </div>

        <h2 className="text-3xl font-black text-on-surface tracking-tighter mb-4">
          {status.error ? 'Clinical Pipeline Interrupted' : 'Analyzing Botanical Specimen'}
        </h2>
        
        <p className="text-on-surface-variant text-sm uppercase tracking-[0.2em] font-bold mb-12 h-6 animate-pulse">
          {status.error || status.label}
        </p>

        {/* Progress Timeline */}
        <div className="flex justify-between items-center relative mb-12 px-2">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-surface-container -translate-y-1/2 -z-10" />
          <motion.div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 -z-10 shadow-[0_0_15px_rgba(0,163,142,0.5)]"
            initial={{ width: '0%' }}
            animate={{ width: `${(status.step / 9) * 100}%` }}
          />
          
          {progressSteps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                status.step >= step.id ? 'bg-primary border-primary scale-125' : 'bg-surface border-surface-container'
              }`} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${
                status.step >= step.id ? 'text-primary' : 'text-on-surface-variant/40'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {status.error && (
          <button 
            onClick={() => navigate('/scan')}
            className="bg-error text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest"
          >
            Retry Protocol
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportLoadingPage;
