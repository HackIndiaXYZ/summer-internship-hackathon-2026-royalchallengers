import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

/**
 * AnalysisReport — Medo Veda V7.0
 * Scientific / Editorial Clinical Report Layout
 * Synchronized with High-Fidelity Benchmark Screenshot
 */
const AnalysisReport = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllIngredients, setShowAllIngredients] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (location.state?.analysis) {
      setReport(location.state.analysis);
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/scans/id/${id}`);
        // Support direct objects, DB search records (analysis_result), and runtime status tracking (analysis)
        const data = res.data.data || res.data;
        const mainReport = data.analysis_result || data.analysis || data;

        // Inject image URL from DB row into the report object
        if (data.input_image) {
          mainReport.input_image = data.input_image;
        } else if (data.imageUrl) {
          mainReport.input_image = data.imageUrl;
        }

        // Inject product_name from DB row if analysis_result doesn't have it
        if (!mainReport.productName && data.product_name) {
          mainReport.productName = data.product_name;
        }

        setReport(mainReport);
        setLoading(false);
      } catch (err) {
        console.error('Report retrieval error:', err);
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, location]);

  if (loading) return <LoadingSkeleton />;
  if (!report) return <EmptyState />;

  const {
    productName: rawProductName,
    brand,
    imageUrl: reportImageUrl,
    confidenceScore,
    overallVerdict,
    ingredients = [],
    marketingClaims = [],
    healthImpact = {},
    adviceCard = {},
    alternativeResources = { items: [] },
    nutrition = {}
  } = report;

  // Robust product name — check all possible locations in the response object
  const productName = rawProductName || report.product_name || brand || 'Product Analysis';

  // Final Image URL resolution — check nested analysis OR top-level DB field
  const imageUrl = reportImageUrl || report.input_image || null;

  const getVerdictColor = (v) => {
    if (v === 'safe') return 'bg-emerald-500';
    if (v === 'limit') return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-24 font-sans text-slate-800">
      <div className="max-w-[700px] mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-4 sm:space-y-6">

        {/* SECTION 1: Product Header Card (Horizontal Mobile Optimized) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 flex flex-row gap-4 sm:gap-6 items-start relative overflow-hidden shadow-sm">
          <div className="w-24 sm:w-32 h-24 sm:h-32 bg-slate-50 rounded-2xl flex-shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={productName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=Scan+Image';
                }}
              />
            ) : (
              <span className="material-symbols-outlined text-slate-200 text-3xl sm:text-4xl">inventory_2</span>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
            <div className="space-y-1">
              <div className="flex justify-between items-start gap-2">
                <h1 className="text-[15px] sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">
                  {brand || productName}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-white font-bold text-[9px] sm:text-xs uppercase tracking-wider flex-shrink-0 mt-1 ${getVerdictColor(overallVerdict)}`}>
                  {overallVerdict}
                </span>
              </div>
              <p className="text-[11px] sm:text-sm text-slate-400 font-bold uppercase tracking-widest">
                OVERALL VERDICT
              </p>
            </div>

            <div className="space-y-2 mt-2 sm:mt-4">
              <div className="flex justify-between items-center text-[11px] sm:text-sm">
                <span className="text-slate-500 font-medium italic truncate">Product Name:</span>
                <span className="font-bold text-slate-900 truncate ml-2">{productName}</span>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center text-[11px] sm:text-sm font-bold">
                  <span className="text-slate-500 font-medium italic">Confidence:</span>
                  <span className="text-emerald-600 italic tracking-tighter text-xs sm:text-[16px]">{confidenceScore}%</span>
                </div>
                <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${confidenceScore}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Scientific Ingredient Analysis */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 text-center border-b border-slate-50">
            <h2 className="text-lg font-bold text-slate-700 tracking-tight">Scientific Ingredient Analysis</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest">Ingredient</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left">Standard Guideline (WHO/FSAI)</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(showAllIngredients ? ingredients : ingredients.slice(0, 4)).map((ing, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-[13px] sm:text-base">{ing.name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-left text-slate-500 text-xs sm:text-sm font-medium">{ing.standardGuideline}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-sm">
                        <span className={`material-symbols-outlined text-[14px] sm:text-[18px] ${ing.status === 'Acceptable' ? 'text-emerald-500' : ing.status === 'Caution' ? 'text-amber-500' : 'text-red-500'}`}>
                          {ing.status === 'Acceptable' ? 'check_box' : 'warning'}
                        </span>
                        <span className={ing.status === 'Acceptable' ? 'text-emerald-500' : ing.status === 'Caution' ? 'text-amber-500' : 'text-red-500'}>
                          {ing.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ingredients.length > 4 && (
              <button
                onClick={() => setShowAllIngredients(!showAllIngredients)}
                className="w-full py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center justify-center gap-2 border-t border-slate-50"
              >
                {showAllIngredients ? 'Show Less' : `Show ${ingredients.length - 4} More Ingredients`}
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showAllIngredients ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 2.5: Nutritional Snapshot (Hardened V7.0) */}
        <div className="space-y-4">
          <h2 className="text-[22px] font-bold text-[#111827]">Nutritional Snapshot</h2>
          <div className="grid grid-cols-3 gap-[8px] sm:gap-[12px]">
            {[
              { emoji: '🔥', label: 'Calories', value: nutrition?.calories, unit: ' kcal' },
              { emoji: '🧈', label: 'Fat', value: nutrition?.fat, unit: 'g' },
              { emoji: '🍬', label: 'Sugar', value: nutrition?.sugar, unit: 'g' },
              { emoji: '🧂', label: 'Salt', value: nutrition?.salt, unit: 'g' },
              { emoji: '🥩', label: 'Protein', value: nutrition?.protein, unit: 'g' },
              { emoji: '🍞', label: 'Carbs', value: nutrition?.carbohydrates, unit: 'g' },
            ].map((item, idx) => {
              const displayValue = item.value === 0 ? '0' : (item.value || 'N/A');
              const isNA = displayValue === 'N/A' || displayValue === '—' || displayValue === 'null';

              return (
                <div key={idx} className="bg-[#F3F4F6] rounded-[16px] p-2.5 sm:p-5 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-[24px] sm:text-[36px] mb-1 sm:mb-2">{item.emoji}</span>
                  <p className={`text-[14px] sm:text-[24px] font-bold text-[#111827] leading-none mb-1 ${isNA ? 'text-slate-400 opacity-50' : ''}`}>
                    {isNA ? 'N/A' : `${displayValue}${item.unit}`}
                  </p>
                  <p className="text-[10px] sm:text-[13px] text-[#9CA3AF] font-medium leading-tight">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: 2x2 Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: PERCEPTION */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] sm:text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Perception</h3>
            <div className="space-y-3">
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {marketingClaims[0]?.claim ? `"${marketingClaims[0].claim}"` : 'Analyzing Brand Positioning...'}
              </p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter ${marketingClaims[0]?.verdict === 'True' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {marketingClaims[0]?.verdict === 'True' ? 'verified' : 'warning'}
                </span>
                {marketingClaims[0]?.verdictLabel || 'SCIENTIFIC AUDIT'}
              </div>
            </div>
          </div>

          {/* Card 2: REALITY */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Reality</h3>
            <div className="space-y-3">
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {marketingClaims[0]?.reality || 'Analyzing clinical reality...'}
              </p>
              {marketingClaims[0]?.explanation && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic">
                    {marketingClaims[0].explanation}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Health Impact Stats */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-5 sm:space-y-6 flex flex-col justify-center min-h-[180px] sm:min-h-[220px]">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">What If You Consume This Daily?</h3>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {healthImpact.impactLabel || 'Analyzing daily impact...'}
              </p>
              <p className="text-[32px] font-black text-slate-900 leading-tight">
                {healthImpact.impactValue || '—'}
              </p>
            </div>
            <ul className="space-y-2 border-t border-slate-50 pt-4">
              {(healthImpact.warnings || []).slice(0, 1).map((w, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-slate-600 font-medium italic">
                  <span className="text-slate-900 font-black">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Card 4: Data Sources & Final Verdict */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              {[
                { label: report.input_method === 'image' ? 'Image scan data' : 'Manual input data', type: report.input_method === 'image' ? 'check' : 'warning' },
                { label: ingredients.length > 0 ? `${ingredients.length} ingredients analyzed` : 'Ingredient data', type: ingredients.length > 0 ? 'check' : 'warning' },
                { label: 'AI evidence layer', type: 'check' },
                { label: 'WHO/FSSAI cross-referenced', type: 'check' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <span className={`material-symbols-outlined text-[18px] ${item.type === 'check' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {item.type === 'check' ? 'check_box' : 'warning'}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
            <button className="mt-8 w-full py-4 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
              FINAL VERDICT: {overallVerdict === 'safe' ? 'SAFE TO CONSUME' : 'LIMIT USAGE'}
            </button>
          </div>
        </div>

        {/* SECTION 4: Personalised Advice */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Personalised Advice</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium italic">Safe Intake</span>
              <span className="font-bold text-slate-800">{adviceCard.safeIntake || 'Analyzing...'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium italic">Frequency</span>
              <span className="font-bold text-slate-800">{adviceCard.frequency || 'Analyzing...'}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm sm:text-base">
              <span className="text-slate-500 font-medium italic">Best Time</span>
              <span className="font-bold text-slate-800">{adviceCard.bestTime || 'Analyzing...'}</span>
            </div>

            <div className="mt-6 p-4 bg-[#EBF5F3] rounded-xl border border-emerald-100/50">
              <p className="text-[13px] font-medium text-emerald-800 leading-relaxed italic">
                {adviceCard.consumptionGuideline || 'Calculating clinical guidelines...'}
              </p>
            </div>
          </div>

          <div className="pt-8 space-y-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">eco</span>
              <h3 className="font-bold text-slate-800">Better Indian Alternatives</h3>
            </div>

            <div className="space-y-6">
              {(alternativeResources.items || []).map((alt, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm border border-emerald-100">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 leading-tight text-[13px] sm:text-base">
                      {alt.name} <span className="text-slate-400 font-normal ml-2 text-xs">{alt.price}</span>
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold">{alt.whyBetter}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 5: Footer Actions (Symmetric Layout) */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 pb-20">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-4 bg-[#006B5B] text-white rounded-xl font-bold shadow-lg shadow-teal-900/10 active:scale-95 transition-all text-[14px] sm:text-[15px]"
          >
            Scan Another Product
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all text-[14px] sm:text-[15px]"
          >
            History
          </button>
        </div>

      </div>
    </div>
  );
};

// --- Sub-components (Hardened) ---

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#F8FAFB] py-12 px-4">
    <div className="max-w-[700px] mx-auto space-y-8 animate-pulse">
      <div className="h-48 bg-white rounded-3xl border border-slate-100"></div>
      <div className="h-64 bg-white rounded-3xl border border-slate-100"></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-40 bg-white rounded-3xl border border-slate-100"></div>
        <div className="h-40 bg-white rounded-3xl border border-slate-100"></div>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
      <span className="material-symbols-outlined text-[40px]">science</span>
    </div>
    <h2 className="text-xl font-bold text-slate-800 mb-2">Specimen Missing</h2>
    <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-8">
      The clinical analysis for this specimen could not be retrieved.
    </p>
    <button
      onClick={() => window.location.href = '/'}
      className="px-8 py-4 bg-[#006B5B] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg"
    >
      Restart Protocol
    </button>
  </div>
);

export default AnalysisReport;
