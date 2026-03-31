import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../config';
import Footer from '../components/Footer';

/* ─────────── helpers ─────────── */
const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: d, ease: [.22, 1, .36, 1] }
});

const verdictTheme = {
  SAFE: { color: '#16A34A', bg: '#F0FDF4', ring: '#BBF7D0', icon: 'verified_user' },
  LIMIT: { color: '#D97706', bg: '#FFFBEB', ring: '#FDE68A', icon: 'info' },
  AVOID: { color: '#DC2626', bg: '#FEF2F2', ring: '#FECACA', icon: 'dangerous' }
};

const riskStyle = {
  high: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', badge: 'HIGH' },
  medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', badge: 'MEDIUM' },
  low: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', badge: 'LOW' }
};

const claimStyle = {
  verified: { color: '#16A34A', bg: '#F0FDF4', icon: 'verified', label: 'Verified' },
  true: { color: '#16A34A', bg: '#F0FDF4', icon: 'verified', label: 'Verified' },
  misleading: { color: '#D97706', bg: '#FFFBEB', icon: 'info', label: 'Misleading' },
  false: { color: '#DC2626', bg: '#FEF2F2', icon: 'report', label: 'False' }
};

const CircularGauge = ({ value, max, label, color, size = 110 }) => {
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, max) / max) * circumference;
  
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 drop-shadow-[0_4px_10px_rgba(0,0,0,0.04)]" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#005144]/5" />
        <motion.circle 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="text-[28px] font-black leading-none" style={{ color }}>{value}</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-[#5f6965]/40 mt-1">{label}</span>
      </div>
    </div>
  );
};

/* ────────── component ────────── */
const AnalysisReport = () => {
  const { id } = useParams();
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.analysis) {
      setReport({
        analysis_result: location.state.analysis,
        product_name: location.state.productName || 'Clinical Analysis',
        input_query: location.state.inputQuery || ''
      });
      setLoading(false);
      return;
    }
    (async () => {
      if (!id) { setLoading(false); return; }
      try {
        const r = await axios.get(`${API_URL}/api/scans/id/${id}`);
        if (r.data) setReport(r.data);
      } catch (e) { console.error('Fetch error:', e); }
      finally { setLoading(false); }
    })();
  }, [id, location.state]);

  if (loading) return (
    <div className="min-h-screen bg-[#F0F2F2] flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 relative">
        <div className="absolute inset-0 rounded-full border-[3px] border-[#005144]/8 border-t-[#005144] animate-spin" />
        <span className="material-symbols-outlined text-[36px] text-[#005144] absolute inset-0 flex items-center justify-center animate-pulse">biotech</span>
      </div>
      <span className="text-[10px] font-black uppercase tracking-[.5em] text-[#005144]/30">Calibrating Molecular Model…</span>
    </div>
  );

  if (!report) return (
    <div className="min-h-screen bg-[#F0F2F2] flex flex-col items-center justify-center px-4 gap-3">
      <span className="material-symbols-outlined text-6xl text-[#005144]/15">search_off</span>
      <h2 className="text-2xl font-extrabold text-[#141d1c]">Analysis Unavailable</h2>
      <Link to="/scan" className="mt-3 bg-[#005144] text-white px-7 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-[#005144]/20 active:scale-95 transition-all">New Protocol Scan</Link>
    </div>
  );

  const data = report?.analysis_result || {};
  const product = data.product || {};
  const verdict = data.verdict || {};
  const nutrition = data.nutrition_analysis || {};
  const ingredients = data.ingredient_analysis || [];
  const claimsArr = data.claim_vs_reality || [];
  const highlights = data.highlights || [];
  const advice = data.personalized_advice || {};
  const alternatives = data.alternatives || [];
  const personalization = data.personalization || {};

  const productTitle = (report?.product_name || product.name || 'Product Analysis')
    .replace(/title image extract|clinical extraction|extracted text|analysis result/gi, 'Product Identified')
    .trim();
  
  const vLabel = (verdict.label || 'LIMIT').toUpperCase();
  const vTheme = verdictTheme[vLabel] || verdictTheme.LIMIT;
  const vScore = verdict.score || 0;
  const vConfidence = verdict.confidence || 0;

  // Personalization Display Logic
  const primaryGoal = personalization.primary_goal 
    ? personalization.primary_goal.replace(/_/g, ' ').toUpperCase() 
    : 'GENERAL HEALTH';
  
  const conditionsText = personalization.health_conditions?.length > 0 
    ? personalization.health_conditions.join(', ').toUpperCase() 
    : 'NONE DETECTED';

  return (
    <div className="min-h-screen bg-[#F1F4F4] text-[#141d1c] antialiased pb-20" style={{ fontFamily: "'Inter', system-ui, sans-serif", width: '100%', maxWidth: '100%', position: 'relative', overscrollBehaviorX: 'none' }}>

      <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-xl border-b border-[#005144]/10 shadow-sm transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/history" className="text-[10px] sm:text-[11px] font-bold text-[#5f6965] hover:text-[#005144] transition-colors uppercase tracking-wider whitespace-nowrap">Archive</Link>
            <span className="material-symbols-outlined text-[14px] text-[#5f6965]/30">chevron_right</span>
            <span className="text-[10px] sm:text-[11px] font-black text-[#005144] bg-[#005144]/5 px-2 py-1 sm:px-2.5 rounded-lg truncate pb-[3px]">
              ID-{(id || 'LIVE').slice(-6).toUpperCase()}
            </span>
          </div>
          <Link to="/scan" className="flex items-center gap-1.5 sm:gap-2 bg-[#005144] text-white text-[10px] sm:text-[11px] font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-[#003d33] shadow-lg shadow-[#005144]/10 active:scale-95 transition-all whitespace-nowrap">
            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">add_circle</span> <span className="hidden xs:inline">New Analysis</span><span className="xs:hidden">New</span>
          </Link>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-36 sm:pt-12">

        {/* ── 0. PERSONALIZATION HEADER (Goal Awareness) ── */}
        <motion.div {...fade(0)} className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-[#005144]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#005144] flex items-center justify-center text-white shadow-inner flex-shrink-0">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[.2em] sm:tracking-[.3em] text-[#005144]/40 leading-none mb-1">Clinical Context</p>
              <h3 className="text-xs sm:text-sm font-black text-[#141d1c] tracking-tight truncate">
                Goal: <span className="text-[#005144] ml-1">{primaryGoal}</span>
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0">
             <div className="hidden xs:block text-right">
                <p className="text-[7px] font-black uppercase tracking-[.2em] text-[#5f6965]/40 leading-none mb-1">Medical Conditions</p>
                <div className="flex items-center gap-1 justify-end">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                   <p className="text-[9px] font-bold text-[#3e4946]">{conditionsText}</p>
                </div>
             </div>
             <div className="h-6 w-px bg-[#005144]/10 hidden xs:block" />
             <div className="bg-[#005144]/5 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[12px] text-[#005144]">fingerprint</span>
                <span className="text-[8px] font-black text-[#005144] uppercase tracking-widest whitespace-nowrap">Protocol v4.2</span>
             </div>
          </div>
        </motion.div>

        {/* ── 1. PRODUCT SUMMARY BANNER (Black border) ── */}
        <motion.section {...fade(0)} className="mb-8">
          <div className="bg-white rounded-[24px] md:rounded-[32px] overflow-hidden border-[3px] md:border-[4px] border-black shadow-2xl">
            <div className="p-6 md:p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
              
              <div className="flex flex-row items-center gap-4 sm:gap-6 w-full lg:w-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5" style={{ background: vTheme.bg, border: `3px solid ${vTheme.ring}` }}>
                  <span className="material-symbols-outlined text-[32px] sm:text-[40px]" style={{ color: vTheme.color, fontVariationSettings: "'FILL' 1" }}>{vTheme.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[.3em] sm:tracking-[.4em] text-[#5f6965]/40 mb-0.5 sm:mb-1">Global Verdict</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none" style={{ color: vTheme.color }}>{vLabel}</h2>
                </div>
              </div>

              <div className="hidden lg:block w-px h-24 bg-[#005144]/10 flex-shrink-0" />

              <div className="flex-1 w-full text-left min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[.2em] sm:tracking-[.3em] text-[#005144]/40 mb-1.5 sm:mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">barcode_scanner</span> Sequence Identified
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[#141d1c] mb-3 leading-tight break-words">{productTitle}</h1>
                <div className="flex flex-wrap gap-2">
                  {product.category && <span className="text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#005144] text-white uppercase tracking-widest">{product.category}</span>}
                  <span className="text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white border-2 border-[#005144]/10 text-[#005144]/60 uppercase tracking-widest leading-none flex items-center">Source: {product.source || 'Direct Scan'}</span>
                </div>
              </div>

              <div className="flex-row gap-4 flex-shrink-0 bg-[#005144]/5 p-3 rounded-[24px] hidden sm:flex">
                <CircularGauge value={vScore} max={10} label="Score" color={vTheme.color} size={120} />
                <CircularGauge value={vConfidence} max={100} label="Confidence" color="#005144" size={120} />
              </div>
              
              <div className="flex sm:hidden w-full justify-around bg-[#005144]/5 p-4 rounded-3xl gap-4">
                <CircularGauge value={vScore} max={10} label="Score" color={vTheme.color} size={88} />
                <CircularGauge value={vConfidence} max={100} label="Confidence" color="#005144" size={88} />
              </div>
            </div>
            
            <div className="px-6 md:px-12 py-5 sm:py-6 bg-gradient-to-r from-transparent via-[#005144]/5 to-transparent border-t border-[#005144]/5">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#3e4946] leading-relaxed font-semibold text-center italic">"{verdict.reason}"</p>
            </div>
          </div>
        </motion.section>

        {/* ── 2. NUTRITION CARD (100% Width) ── */}
        <motion.section {...fade(0.05)} className="mb-8">
          <div className="bg-[#141d1c] rounded-[32px] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#005144]/20 blur-[100px] -mr-32 -mt-32" />
            <h3 className="text-[10px] font-black uppercase tracking-[.35em] text-white/30 mb-8 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-lg text-[#16A34A]">analytics</span> Real-Time Nutritional Profile
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
              {[
                { label: 'Calories', val: nutrition.calories, unit: 'kcal', icon: 'bolt', color: '#EF4444' },
                { label: 'Sugar', val: nutrition.sugar_g, unit: 'g', icon: 'cookie', color: '#F59E0B' },
                { label: 'Total Fat', val: nutrition.fat_g, unit: 'g', icon: 'opacity', color: '#8B5CF6' },
                { label: 'Protein', val: nutrition.protein_g, unit: 'g', icon: 'fitness_center', color: '#3B82F6' }
              ].map((n, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-[12px] md:text-sm mb-3" style={{ color: n.color }}>{n.icon}</span>
                  <span className="text-2xl md:text-3xl font-black tracking-tighter leading-none mb-1">{n.val}</span>
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/40">{n.label} ({n.unit})</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── 3. STRATEGY (Clean Professional Structure) ── */}
        <motion.section {...fade(0.1)} className="mb-12">
          <div className="bg-white rounded-[32px] border-[2px] border-[#005144]/20 shadow-xl overflow-hidden">
            {/* Header Area */}
            <div className="bg-[#005144]/5 border-b border-[#005144]/10 px-6 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#005144] flex items-center justify-center text-white shadow-lg shadow-[#005144]/10 flex-shrink-0">
                  <span className="material-symbols-outlined text-lg sm:xl">clinical_notes</span>
                </div>
                <div>
                  <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[.3em] sm:tracking-[.4em] text-[#005144]">Clinical Strategy</h3>
                  <p className="text-[7px] sm:text-[8px] font-bold text-[#5f6965]/40 uppercase tracking-widest mt-0.5 whitespace-nowrap">Protocol v4.2 · Secure Analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#005144]/10 self-end sm:self-auto">
                <span className="material-symbols-outlined text-[12px] sm:text-sm text-[#005144]">verified_user</span>
                <span className="text-[8px] sm:text-[9px] font-black text-[#005144] uppercase tracking-widest whitespace-nowrap">Medical Intelligence Active</span>
              </div>
            </div>

            {/* Main Strategy Analysis */}
            <div className="p-6 sm:p-8">
              <div className="mb-8">
                <label className="text-[8px] sm:text-[9px] font-black uppercase tracking-[.2em] sm:tracking-[.3em] text-[#5f6965]/40 block mb-3">Therapeutic Observation</label>
                <div className="bg-[#f8fafa] p-5 sm:p-6 rounded-2xl border border-[#005144]/5 relative">
                  <span className="absolute -left-1 top-4 w-1 h-8 bg-[#005144] rounded-full" />
                  <p className="text-sm sm:text-base md:text-lg font-bold text-[#141d1c] leading-relaxed">
                    {advice.summary}
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#005144]/10 hover:border-[#005144]/30 transition-all group">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <span className="material-symbols-outlined text-[#005144] text-[18px] sm:text-[20px]">scale</span>
                    <label className="text-[9px] sm:text-[10px] font-black text-[#5f6965]/60 uppercase tracking-widest leading-none">Intake Profile</label>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-[#141d1c] group-hover:text-[#005144] transition-colors leading-tight">{advice.intake}</p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#005144]/10 hover:border-[#005144]/30 transition-all group">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <span className="material-symbols-outlined text-[#005144] text-[18px] sm:text-[20px]">event_repeat</span>
                    <label className="text-[9px] sm:text-[10px] font-black text-[#5f6965]/60 uppercase tracking-widest leading-none">Frequency Cycle</label>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-[#141d1c] group-hover:text-[#005144] transition-colors leading-tight">{advice.frequency}</p>
                </div>
              </div>

              {/* Security Warnings */}
              {advice.warnings?.length > 0 && (
                <div className="mt-10 pt-8 border-t border-[#005144]/5">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <label className="text-[10px] font-black text-red-600/60 uppercase tracking-[.3em]">Critical Safety Vectors</label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {advice.warnings.map((w, i) => (
                      <div key={i} className="flex gap-4 items-center p-5 rounded-2xl bg-red-50/20 border-2 border-red-100/50 hover:bg-red-50 transition-colors">
                        <span className="material-symbols-outlined text-red-600 text-lg">warning</span>
                        <p className="text-xs font-bold text-red-800/80 leading-snug">{w}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>


        {/* ── 4. INGREDIENTS (Optimized Flex/Grid) ── */}
        <div className="mb-20">
          <h3 className="text-[10px] font-black uppercase tracking-[.3em] text-[#005144]/40 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">science</span> Molecular Intelligence & Ingredient Vectors
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
            {ingredients.map((item, idx) => {
              const rs = riskStyle[item.risk] || riskStyle.low;
              const isGoalRelevant = item.classification === 'PERSONAL_HIT' || item.classification === 'PERSONAL_MISS';
              return (
                <motion.div
                  key={idx}
                  {...fade(0.15 + (idx * 0.05))}
                  className={`rounded-2xl p-5 border-2 bg-white hover:shadow-lg transition-all group relative flex flex-col w-full h-full ${isGoalRelevant ? 'ring-2 ring-primary/20 bg-primary/[0.02]' : ''}`}
                  style={{ borderColor: rs.border }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-black text-sm md:text-base text-[#141d1c] leading-tight group-hover:text-[#005144] transition-colors">{item.name}</h4>
                      {item.classification && (
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block ${
                          item.classification === 'PERSONAL_HIT' ? 'bg-green-100 text-green-700' : 
                          item.classification === 'PERSONAL_MISS' ? 'bg-red-100 text-red-700' : 
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {item.classification.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest whitespace-nowrap border bg-white"
                      style={{ color: rs.text, borderColor: rs.border }}>{rs.badge}</span>
                  </div>
                  <p className="text-[11px] md:text-xs text-[#5f6965] leading-relaxed font-semibold mb-4 flex-1">{item.reason}</p>
                  <div className="pt-3 border-t border-[#005144]/5 flex justify-between items-center">
                    <span className="text-[9px] font-black text-[#005144]/40 uppercase tracking-widest">{item.function || 'Compound'}</span>
                    <span className="material-symbols-outlined text-[12px] text-[#005144]/20 group-hover:text-[#005144]/50 transition-colors">biotech</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── 5. MARKETING CLAIMS vs REALITY (Optimized Bento Grid) ── */}
        {claimsArr.length > 0 && (
          <div className="mb-20">
            <h3 className="text-[10px] font-black uppercase tracking-[.3em] text-[#005144]/40 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">verified</span> Marketing Deception Interface
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {claimsArr.map((claim, idx) => {
                const style = claimStyle[claim.status?.toLowerCase()] || claimStyle.misleading;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-3xl p-8 border-2 border-black/5 hover:border-black/10 transition-all shadow-sm flex flex-col relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                      <span className="material-symbols-outlined text-8xl leading-none">{style.icon}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ backgroundColor: style.bg, color: style.color }}>
                        <span className="material-symbols-outlined">{style.icon}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ backgroundColor: style.bg, color: style.color }}>
                        {style.label}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-[#141d1c] mb-4 leading-tight relative z-10">"{claim.claim}"</h4>
                    <div className="mt-auto pt-6 border-t border-black/5 relative z-10">
                      <p className="text-sm font-bold text-[#5f6965] leading-relaxed">
                        <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#005144] block mb-2 opacity-40">Clinical Reality Check</span>
                        {claim.reality}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 6. STRATEGIC ALTERNATIVES (Horizontal Bento) ── */}
        {alternatives.length > 0 && (
          <div className="mb-20">
            <h3 className="text-[10px] font-black uppercase tracking-[.3em] text-[#005144]/40 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">swap_horiz</span> Goal-Aware Swaps & Alternatives
            </h3>
            <div className="bg-[#141d1c] rounded-[40px] p-8 md:p-12 relative overflow-hidden border-[4px] border-[#005144]/10 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#005144]/20 to-transparent" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alternatives.map((alt, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 hover:bg-white/10 transition-all group flex flex-col h-full"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#005144] flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">eco</span>
                    </div>
                    <h4 className="text-xl font-black text-white mb-2 tracking-tight group-hover:text-primary transition-colors">{alt.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#005144] mb-4">{alt.brand || 'Premium Choice'}</p>
                    <p className="text-sm font-medium text-white/50 leading-relaxed italic flex-1">"{alt.reason}"</p>
                    <div className="mt-6 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[9px] font-black text-[#005144] uppercase tracking-widest flex items-center gap-2">Goal Compatibility: High <div className="w-1.5 h-1.5 rounded-full bg-green-500" /></span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-12 flex justify-center relative z-10">
                <Link to="/scan" className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">biotech</span>
                  Analyze These Alternatives
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AnalysisReport;
