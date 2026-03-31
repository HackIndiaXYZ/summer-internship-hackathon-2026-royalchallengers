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

  const productTitle = report?.product_name || product.name || 'Clinical Analysis';
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
    <div className="min-h-screen bg-[#F1F4F4] text-[#141d1c] antialiased pb-20" style={{ fontFamily: "'Inter', system-ui, sans-serif", width: '100%', maxWidth: '100%', overflowX: 'hidden', position: 'relative', overscrollBehaviorX: 'none' }}>

      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-[#005144]/10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/history" className="text-[11px] font-bold text-[#5f6965] hover:text-[#005144] transition-colors uppercase tracking-wider">Reports Archive</Link>
            <span className="material-symbols-outlined text-[14px] text-[#5f6965]/30">chevron_right</span>
            <span className="text-[11px] font-black text-[#005144] bg-[#005144]/5 px-2.5 py-1 rounded-lg">ID-{(id || 'LIVE').slice(-6).toUpperCase()}</span>
          </div>
          <Link to="/scan" className="flex items-center gap-2 bg-[#005144] text-white text-[11px] font-bold px-5 py-2.5 rounded-xl hover:bg-[#003d33] shadow-lg shadow-[#005144]/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[16px]">add_circle</span> New Analysis
          </Link>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-6">

        {/* ── 0. PERSONALIZATION HEADER (Goal Awareness) ── */}
        <motion.div {...fade(0)} className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-[#005144]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#005144] flex items-center justify-center text-white shadow-inner">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.3em] text-[#005144]/40 leading-none mb-1">Clinical Context</p>
              <h3 className="text-sm font-black text-[#141d1c] tracking-tight truncate max-w-[200px] md:max-w-none">
                Goal: <span className="text-[#005144] ml-1">{primaryGoal}</span>
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-right">
                <p className="text-[8px] font-black uppercase tracking-[.3em] text-[#5f6965]/40 leading-none mb-1">Medical Conditions</p>
                <div className="flex items-center gap-1 justify-end">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-[#3e4946]">{conditionsText}</p>
                </div>
             </div>
             <div className="h-8 w-px bg-[#005144]/10 hidden sm:block" />
             <div className="bg-[#005144]/5 px-3 py-2 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#005144]">fingerprint</span>
                <span className="text-[10px] font-black text-[#005144] uppercase tracking-widest">Protocol v4.2.1</span>
             </div>
          </div>
        </motion.div>

        {/* ── 1. PRODUCT SUMMARY BANNER (Black border) ── */}
        <motion.section {...fade(0)} className="mb-8">
          <div className="bg-white rounded-[32px] overflow-hidden border-[4px] border-black shadow-2xl">
            <div className="p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-10">
              
              <div className="flex-shrink-0 flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5" style={{ background: vTheme.bg, border: `3px solid ${vTheme.ring}` }}>
                  <span className="material-symbols-outlined text-[40px]" style={{ color: vTheme.color, fontVariationSettings: "'FILL' 1" }}>{vTheme.icon}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.4em] text-[#5f6965]/40 mb-1">Global Verdict</p>
                  <h2 className="text-4xl font-black tracking-tight" style={{ color: vTheme.color }}>{vLabel}</h2>
                </div>
              </div>

              <div className="hidden lg:block w-px h-24 bg-[#005144]/10" />

              <div className="flex-1 text-center lg:text-left min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#005144]/40 mb-2 flex items-center justify-center lg:justify-start gap-2">
                  <span className="material-symbols-outlined text-[14px]">barcode_scanner</span> Sequence Identified
                </p>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[#141d1c] mb-3 leading-none truncate md:whitespace-normal">{productTitle}</h1>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                  {product.category && <span className="text-[9px] md:text-[10px] font-black px-4 py-1.5 rounded-full bg-[#005144] text-white uppercase tracking-widest">{product.category}</span>}
                  <span className="text-[9px] md:text-[10px] font-black px-4 py-1.5 rounded-full bg-white border-2 border-[#005144]/10 text-[#005144]/60 uppercase tracking-widest">Source: {product.source || 'Direct Scan'}</span>
                </div>
              </div>

              <div className="flex-row gap-4 flex-shrink-0 bg-[#005144]/5 p-3 rounded-[24px] hidden sm:flex">
                <CircularGauge value={vScore} max={10} label="Score" color={vTheme.color} size={window.innerWidth < 400 ? 80 : 120} />
                <CircularGauge value={vConfidence} max={100} label="Confidence" color="#005144" size={window.innerWidth < 400 ? 80 : 120} />
              </div>
              <div className="flex sm:hidden w-full justify-around bg-[#005144]/5 p-4 rounded-3xl mt-4">
                <CircularGauge value={vScore} max={10} label="Score" color={vTheme.color} size={90} />
                <CircularGauge value={vConfidence} max={100} label="Confidence" color="#005144" size={90} />
              </div>
            </div>
            
            <div className="px-6 md:px-12 py-6 bg-gradient-to-r from-transparent via-[#005144]/5 to-transparent border-t border-[#005144]/5">
              <p className="text-base md:text-lg lg:text-xl text-[#3e4946] leading-relaxed font-semibold text-center italic">"{verdict.reason}"</p>
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
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

        {/* ── 3. STRATEGY (Horizontal Flow) ── */}
        <motion.section {...fade(0.1)} className="mb-12">
          <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border-[3px] md:border-[4px] border-[#005144] shadow-2xl relative overflow-hidden">
            {/* Header with Summary - Horizontal Flow */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 md:gap-10 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-[#005144]/10">
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#005144]/10 flex items-center justify-center text-[#005144] border-2 border-[#005144]/20">
                  <span className="material-symbols-outlined text-xl md:text-2xl">clinical_notes</span>
                </div>
                <div>
                  <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[.4em] text-[#005144] leading-none mb-1">Clinical Strategy</h3>
                  <span className="text-[8px] font-bold text-[#5f6965]/40 uppercase tracking-widest">Protocol v4.2</span>
                </div>
              </div>
              <div className="flex-1 bg-[#005144]/5 p-5 md:p-6 rounded-2xl border-2 border-[#005144]/10">
                <p className="text-sm md:text-base font-bold leading-relaxed text-[#005144]">
                  <span className="text-[9px] font-black uppercase tracking-[.25em] mr-4 opacity-40">Observation:</span>
                  {advice.summary}
                </p>
              </div>
            </div>
            
            {/* Horizontal Grid for Intake & Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#005144]/10 border border-[#005144]/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-inner">
              <div className="bg-white p-6 md:p-8 flex items-center justify-between group transition-colors hover:bg-[#F0FDF4]/30">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#005144]/30 text-lg group-hover:text-[#005144] transition-colors">scale</span>
                  <label className="text-[10px] md:text-[11px] font-black text-[#5f6965]/60 uppercase tracking-[.2em]">Intake Profile</label>
                </div>
                <p className="text-lg md:text-2xl font-black text-[#141d1c] tracking-tight">{advice.intake}</p>
              </div>
              
              <div className="bg-white p-6 md:p-8 flex items-center justify-between group transition-colors hover:bg-[#F0FDF4]/30">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#005144]/30 text-lg group-hover:text-[#005144] transition-colors">calendar_month</span>
                  <label className="text-[10px] md:text-[11px] font-black text-[#5f6965]/60 uppercase tracking-[.2em]">Frequency Cycle</label>
                </div>
                <p className="text-lg md:text-2xl font-black text-[#141d1c] tracking-tight">{advice.frequency}</p>
              </div>
            </div>

            {/* Warnings - Dense Grid */}
            {advice.warnings?.length > 0 && (
              <div className="mt-8 md:mt-12">
                <label className="text-[9px] md:text-[10px] font-black text-red-600/50 uppercase tracking-[.35em] block mb-4 md:mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> Clinical Security Warnings
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {advice.warnings.map((w,i) => (
                    <div key={i} className="flex gap-3 md:gap-4 items-center p-4 md:p-5 rounded-2xl bg-red-50/30 border-2 border-red-100 hover:border-red-200 hover:bg-red-50 transition-all duration-300">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px] md:text-[18px] text-red-600">warning</span>
                      </div>
                      <p className="text-[11px] md:text-xs font-bold text-red-700 leading-snug">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
