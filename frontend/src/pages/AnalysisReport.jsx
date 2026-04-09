import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const reportRef = useRef(null);

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

  const normalizeNutritionValue = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;

    const raw = String(value).trim();
    if (!raw) return null;

    const lowered = raw.toLowerCase();
    if (lowered === 'n/a' || lowered === 'na' || lowered === 'null' || lowered === '—' || lowered === '-') {
      return null;
    }

    const numeric = Number(raw.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(numeric) ? numeric : null;
  };

  const pickNutritionField = (source, keys) => {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source || {}, key)) {
        const value = normalizeNutritionValue(source[key]);
        if (value !== null) return value;
      }
    }
    return null;
  };

  const hasNutritionData = (source) => {
    if (!source || typeof source !== 'object') return false;
    return Object.values(source).some((value) => normalizeNutritionValue(value) !== null);
  };

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
    nutrition: rawNutrition = {}
  } = report;

  const normalizeGuidelineText = (value) => {
    const text = String(value || '').trim();
    if (!text) {
      return '[General Caution]: No verified numeric guideline available; consume in moderation.';
    }

    const lowered = text.toLowerCase();
    if (['none', 'n/a', 'na', 'null', '-', 'not available'].includes(lowered)) {
      return '[General Caution]: No verified numeric guideline available; consume in moderation.';
    }

    return text;
  };

  const normalizedIngredients = (ingredients || []).map((ing) => ({
    name: ing?.name || 'Unknown Ingredient',
    standardGuideline: normalizeGuidelineText(ing?.standardGuideline),
    status: ing?.status || 'Caution'
  }));

  const nutritionSource = [
    rawNutrition,
    report.nutritionalSnapshot,
    report.nutrition_snapshot,
    report.healthImpact?.nutritionalSnapshot,
    report.healthImpact?.nutrition
  ].find((source) => hasNutritionData(source)) || {};

  const normalizedNutrition = {
    calories: pickNutritionField(nutritionSource, ['calories', 'energy_kcal', 'kcal', 'energy']),
    fat: pickNutritionField(nutritionSource, ['fat', 'total_fat']),
    sugar: pickNutritionField(nutritionSource, ['sugar', 'sugars']),
    salt: pickNutritionField(nutritionSource, ['salt', 'sodium', 'sodium_salt_equivalent']),
    protein: pickNutritionField(nutritionSource, ['protein', 'proteins']),
    carbohydrates: pickNutritionField(nutritionSource, ['carbohydrates', 'carbs', 'carbohydrate'])
  };

  // Robust product name — check all possible locations in the response object
  const productName = rawProductName || report.product_name || brand || 'Product Analysis';

  // Final Image URL resolution — check nested analysis OR top-level DB field
  const imageUrl = reportImageUrl || report.input_image || null;

  const getVerdictColor = (v) => {
    if (v === 'safe') return 'bg-emerald-500';
    if (v === 'limit') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;

    try {
      setDownloadingPdf(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8FAFB',
        scrollY: -window.scrollY
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeName = (productName || 'report').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      pdf.save(`medo-veda-${safeName}-report.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error(`Failed to generate PDF${err?.message ? `: ${err.message}` : ''}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] pt-[10vh] pb-24 font-sans text-slate-800">
      <div ref={reportRef} className="max-w-[700px] mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-4 sm:space-y-6">

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
                <h1 className="text-[17px] sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                  {brand && brand !== productName ? `${brand} ${productName}` : productName}
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
                {(showAllIngredients ? normalizedIngredients : normalizedIngredients.slice(0, 4)).map((ing, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-[13px] sm:text-base">{ing.name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-left text-slate-500 text-xs sm:text-sm font-medium">{ing.standardGuideline}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-sm">
                        <span className={`material-symbols-outlined text-[14px] sm:text-[18px] ${
                          ing.status === 'Acceptable' ? 'text-emerald-500' : 
                          ing.status === 'Limit' || ing.status === 'Caution' ? 'text-amber-500' : 
                          'text-red-500'
                        }`}>
                          {ing.status === 'Acceptable' ? 'check_box' : 'warning'}
                        </span>
                        <span className={
                          ing.status === 'Acceptable' ? 'text-emerald-500' : 
                          ing.status === 'Limit' || ing.status === 'Caution' ? 'text-amber-500' : 
                          'text-red-500'
                        }>
                          {ing.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {normalizedIngredients.length > 4 && (
              <button
                onClick={() => setShowAllIngredients(!showAllIngredients)}
                className="w-full py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center justify-center gap-2 border-t border-slate-50"
              >
                {showAllIngredients ? 'Show Less' : `Show ${normalizedIngredients.length - 4} More Ingredients`}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {[
              { emoji: '🔥', label: 'Calories', value: normalizedNutrition.calories, unit: ' kcal' },
              { emoji: '🧈', label: 'Fat', value: normalizedNutrition.fat, unit: 'g' },
              { emoji: '🍬', label: 'Sugar', value: normalizedNutrition.sugar, unit: 'g' },
              { emoji: '🧂', label: 'Salt', value: normalizedNutrition.salt, unit: 'g' },
              { emoji: '🥩', label: 'Protein', value: normalizedNutrition.protein, unit: 'g' },
              { emoji: '🍞', label: 'Carbs', value: normalizedNutrition.carbohydrates, unit: 'g' },
            ].map((item, idx) => {
              const displayValue = item.value === 0 ? '0' : (item.value ?? 'N/A');
              const isNA = displayValue === 'N/A' || displayValue === '—' || displayValue === 'null';

              return (
                <div key={idx} className="bg-[#F3F4F6] rounded-[16px] p-2.5 sm:p-5 flex flex-col items-center justify-center text-center shadow-sm min-h-[110px] sm:min-h-[140px]">
                  <span className="text-[24px] sm:text-[36px] mb-1 sm:mb-2">{item.emoji}</span>
                  <p className={`text-[13px] sm:text-[22px] font-bold text-[#111827] leading-none mb-1 ${isNA ? 'text-slate-400 opacity-50' : ''}`}>
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
              <p className="text-[18px] sm:text-[20px] font-bold text-slate-900 leading-tight">
                {healthImpact.impactValue || '—'}
              </p>
            </div>
            <div className="space-y-3 border-t border-slate-50 pt-4">
              <div className="bg-[#F8FAFB] border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Short-Term Effect</p>
                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{healthImpact.shortTermEffect || 'Short-term effect varies by quantity and user profile.'}</p>
              </div>
              <div className="bg-[#F8FAFB] border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Long-Term Effect</p>
                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{healthImpact.longTermEffect || 'Long-term frequent intake may increase cumulative health burden.'}</p>
              </div>
            </div>
          </div>

          {/* Card 4: Data Sources & Final Verdict */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              {[
                { label: report.input_method === 'image' ? 'Image scan data' : 'Manual input data', type: report.input_method === 'image' ? 'check' : 'warning' },
                { label: normalizedIngredients.length > 0 ? `${normalizedIngredients.length} ingredients analyzed` : 'Ingredient data', type: normalizedIngredients.length > 0 ? 'check' : 'warning' },
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

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 items-start py-3 border-b border-slate-100 gap-1 sm:gap-2">
              <span className="sm:col-span-5 text-slate-500 font-medium text-left">Safe Intake</span>
              <span className="sm:col-span-7 font-bold text-slate-800 text-left break-words">{adviceCard.safeIntake || 'Analyzing...'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 items-start py-3 border-b border-slate-100 gap-1 sm:gap-2">
              <span className="sm:col-span-5 text-slate-500 font-medium text-left">Frequency</span>
              <span className="sm:col-span-7 font-bold text-slate-800 text-left break-words">{adviceCard.frequency || 'Analyzing...'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 items-start py-3 gap-1 sm:gap-2">
              <span className="sm:col-span-5 text-slate-500 font-medium text-left">Best Time</span>
              <span className="sm:col-span-7 font-bold text-slate-800 text-left break-words">{adviceCard.bestTime || 'Analyzing...'}</span>
            </div>

            <div className="mt-5 p-4 bg-[#EBF5F3] rounded-xl border border-emerald-100/50">
              <p className="text-[13px] font-medium text-emerald-800 leading-relaxed">
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

        {/* SECTION 5: Report Export */}
        <div className="pt-4 pb-20">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="w-full py-4 bg-[#006B5B] text-white rounded-xl font-bold shadow-lg shadow-teal-900/10 active:scale-95 transition-all text-[14px] sm:text-[15px] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {downloadingPdf ? 'Preparing PDF...' : 'Download PDF Report'}
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
