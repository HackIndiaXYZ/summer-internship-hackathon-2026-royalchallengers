import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
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
        const r = await axios.get(`http://localhost:3001/api/scans/id/${id}`);
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

  const productTitle = report?.product_name || product.name || 'Clinical Analysis';
  const vLabel = (verdict.label || 'LIMIT').toUpperCase();
  const vTheme = verdictTheme[vLabel] || verdictTheme.LIMIT;
  const vScore = verdict.score || 5;
  const vConfidence = verdict.confidence || 70;

  return (
    <div className="min-h-screen bg-[#F1F4F4] text-[#141d1c] antialiased pb-20" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

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

      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-10">

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

              <div className="flex flex-row gap-4 flex-shrink-0 bg-[#005144]/5 p-3 rounded-[24px]">
                <CircularGauge value={vScore} max={10} label="Score" color={vTheme.color} size={window.innerWidth < 400 ? 80 : window.innerWidth < 768 ? 90 : 120} />
                <CircularGauge value={vConfidence} max={100} label="Confidence" color="#005144" size={window.innerWidth < 400 ? 80 : window.innerWidth < 768 ? 90 : 120} />
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
              return (
                <motion.div
                  key={idx}
                  {...fade(0.15 + (idx * 0.05))}
                  className="rounded-2xl p-5 border-2 bg-white hover:shadow-lg transition-all group relative flex flex-col w-full h-full"
                  style={{ borderColor: rs.border }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-black text-sm md:text-base text-[#141d1c] leading-tight group-hover:text-[#005144] transition-colors">{item.name}</h4>
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
      </main>
      <Footer />
    </div>
  );
};

export default AnalysisReport;
