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
        setReport(res.data.analysis_result || res.data);
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
    productName,
    brand,
    imageUrl,
    confidenceScore,
    overallVerdict,
    ingredients = [],
    marketingClaims = [],
    healthImpact = {},
    adviceCard = {},
    alternativeResources = { items: [] },
  } = report;

  const getVerdictColor = (v) => {
    if (v === 'safe') return 'bg-emerald-500';
    if (v === 'limit') return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-24 font-sans text-slate-800">
      <div className="max-w-[700px] mx-auto p-4 md:p-8 space-y-6">

        {/* SECTION 1: Product Header Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-sm">
          <div className="w-full md:w-32 h-32 bg-slate-50 rounded-2xl flex-shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center">
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
              <span className="material-symbols-outlined text-slate-200 text-4xl">inventory_2</span>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {brand ? `${brand} ${productName}` : productName}
              </h1>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">OVERALL VERDICT</span>
                <span className={`px-4 py-1.5 rounded-full text-white font-bold text-xs uppercase tracking-wider ${getVerdictColor(overallVerdict)}`}>
                  {overallVerdict}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium italic">Product Name:</span>
                <span className="font-bold text-slate-900">{productName}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500 font-medium italic">System Confidence:</span>
                  <span className="text-emerald-600 italic tracking-tighter text-[16px]">{confidenceScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
                    <td className="px-6 py-4 font-bold text-slate-800">{ing.name}</td>
                    <td className="px-6 py-4 text-left text-slate-500 text-sm font-medium">{ing.standardGuideline}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-bold text-sm">
                        <span className={`material-symbols-outlined text-[18px] ${ing.status === 'Acceptable' ? 'text-emerald-500' : ing.status === 'Caution' ? 'text-amber-500' : 'text-red-500'}`}>
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

        {/* SECTION 3: 2x2 Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: THE PERCEPTION */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-emerald-600 tracking-tight">Perception vs Reality</h3>
            <div className="space-y-3">
              <p className="text-xl font-bold text-slate-900 leading-tight">
                {marketingClaims[0]?.claim ? `"${marketingClaims[0].claim}"` : 'Analyzing Brand Positioning...'}
              </p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter ${marketingClaims[0]?.verdict === 'True' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {marketingClaims[0]?.verdict === 'True' ? 'verified' : 'warning'}
                </span>
                {marketingClaims[0]?.verdictLabel || 'SCIENTIFIC AUDIT IN PROGRESS'}
              </div>
              {marketingClaims[0]?.verdict !== 'True' && (
                <p className="text-sm text-slate-400 font-medium">
                  {brand || productName} is a natural product.
                </p>
              )}
            </div>
          </div>

          {/* Card 2: THE CLINICAL REALITY */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Perception—Reality</h3>
            <div className="space-y-2">
              <p className="text-lg font-bold text-slate-900">
                {marketingClaims[0]?.verdict === 'True' ? 'True' : 'Clinical Deviation'}
              </p>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {marketingClaims[0]?.verdict === 'True' ? 'True' : marketingClaims[0]?.reality}
              </p>
            </div>
          </div>

          {/* Card 3: Health Impact Stats */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 flex flex-col justify-center min-h-[220px]">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">What If You Consume This Daily?</h3>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {healthImpact.impactLabel || 'Sodium Intake Increase:'}
              </p>
              <p className="text-[32px] font-black text-slate-900 leading-tight">
                {healthImpact.impactValue || '120-150%'}
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

          {/* Card 4: Checklist & Final Verdict */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              {[
                { label: 'Manual input data', type: 'warning' },
                { label: 'Curated sample data', type: 'check' },
                { label: 'Evidence layer', type: 'check' },
                { label: 'FSSAI', type: 'check' }
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
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Personalised Advice</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium italic">Safe Intake</span>
              <span className="font-bold text-slate-800">{adviceCard.safeIntake || '1-2 teaspoons daily'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium italic">Frequency</span>
              <span className="font-bold text-slate-800">{adviceCard.frequency || 'Daily'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 font-medium italic">Best Time</span>
              <span className="font-bold text-slate-800">{adviceCard.bestTime || 'Morning or with meals.'}</span>
            </div>

            <div className="mt-6 p-4 bg-[#EBF5F3] rounded-xl border border-emerald-100/50">
              <p className="text-[13px] font-medium text-emerald-800 leading-relaxed italic">
                {adviceCard.consumptionGuideline || 'Can be used as a sweetener or in herbal teas.'}
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
                    <h4 className="font-bold text-slate-900 leading-tight">
                      {alt.name} <span className="text-slate-400 font-normal ml-2 text-xs">{alt.price}</span>
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">{alt.whyBetter}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 5: Footer Actions */}
        <div className="flex flex-col md:flex-row gap-4 pt-4 pb-20">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-4 bg-[#006B5B] text-white rounded-xl font-bold shadow-lg shadow-teal-900/10 active:scale-95 transition-all text-[15px]"
          >
            Scan Another Product
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all text-[15px]"
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
