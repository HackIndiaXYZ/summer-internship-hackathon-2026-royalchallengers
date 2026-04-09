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
    let isActive = true;
    let pollTimeout;
    let consecutiveNetworkErrors = 0;
    const maxNetworkErrors = 6;
    const pollEveryMs = 2000;
    const maxPollingMs = 180000;
    const startedAt = Date.now();

    const scheduleNextPoll = () => {
      if (!isActive) return;
      pollTimeout = setTimeout(pollStatus, pollEveryMs);
    };

    const pollStatus = async () => {
      let shouldContinuePolling = true;

      try {
        const res = await axios.get(`${API_URL}/api/scan/status/${scanId}`);
        const data = res.data;
        consecutiveNetworkErrors = 0;

        setStatus(data);

        if (data.complete) {
          shouldContinuePolling = false;
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

        consecutiveNetworkErrors += 1;

        if (consecutiveNetworkErrors >= maxNetworkErrors) {
          shouldContinuePolling = false;
          setStatus((prev) => ({
            ...prev,
            complete: true,
            error: 'Connection to backend was lost. Please ensure backend server is running, then retry.'
          }));
          return;
        }
      }

      if (Date.now() - startedAt > maxPollingMs) {
        shouldContinuePolling = false;
        setStatus((prev) => ({
          ...prev,
          complete: true,
          error: 'Analysis timed out. Please retry with a clearer image.'
        }));
      }

      if (shouldContinuePolling) {
        scheduleNextPoll();
      }
    };

    pollStatus(); // Initial call

    return () => {
      isActive = false;
      clearTimeout(pollTimeout);
    };
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
    <div className="min-h-screen bg-surface flex flex-col items-center justify-start pt-[10vh] p-4 sm:p-6 text-center">
      <div className="max-w-md w-full">
        {/* Animated Icon */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 relative mx-auto mb-8 sm:mb-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-dashed border-primary/20"
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-3 sm:inset-4 rounded-2xl sm:rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40"
          >
            <span className="material-symbols-outlined text-white text-3xl sm:text-4xl">clinical_notes</span>
          </motion.div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tighter mb-3 sm:mb-4">
          {status.error ? 'Clinical Pipeline Interrupted' : 'Analyzing Botanical Specimen'}
        </h2>
        
        <p className="text-on-surface-variant text-xs sm:text-sm uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold mb-8 sm:mb-12 min-h-[1.5rem] animate-pulse">
          {status.error || status.label}
        </p>

        {/* Progress Timeline */}
        <div className="flex justify-between items-center relative mb-8 sm:mb-12 px-1 sm:px-2 gap-1">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-surface-container -translate-y-1/2 -z-10" />
          <motion.div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 -z-10 shadow-[0_0_15px_rgba(0,163,142,0.5)]"
            initial={{ width: '0%' }}
            animate={{ width: `${(status.step / 9) * 100}%` }}
          />
          
          {progressSteps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-1 sm:gap-2 min-w-0">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 transition-all duration-500 ${
                status.step >= step.id ? 'bg-primary border-primary scale-125' : 'bg-surface border-surface-container'
              }`} />
              <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-[0.16em] sm:tracking-widest whitespace-nowrap ${
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
            className="bg-error text-white font-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-[10px] uppercase tracking-widest min-h-[44px]"
          >
            Retry Protocol
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportLoadingPage;
