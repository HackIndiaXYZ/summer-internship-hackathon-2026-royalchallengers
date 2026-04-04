import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";
import Footer from "../components/Footer";

const HistoryPage = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/scans/${user.id}`);
          setScans(res.data);
        } catch (err) {
          console.error("History Fetch Error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    } else {
      // Simulate fake data for non-logged in users
      setScans([
        {
          id: "SIM-MAGGI-01",
          product_name: "Maggi 2-Minute Noodles",
          input_method: "barcode",
          overall_verdict: "limit",
          created_at: new Date().toISOString(),
          analysis_result: {
            productName: "Maggi 2-Minute Noodles",
            brand: "Nestlé",
            overallVerdict: "limit",
            confidenceScore: 94,
            healthImpact: {
              personalizedSummary: "High sodium load (~0.8g/serving) detected. Refined flour base may trigger glycemic spikes in your profile.",
              personalizedRiskScore: 65
            },
            ingredients: [
              { name: "Refined Wheat Flour", standardGuideline: "WHO: Limit refined carbs", status: "Caution" },
              { name: "Palm Oil", standardGuideline: "AHA: High saturated fat", status: "Caution" },
              { name: "Iodized Salt", standardGuideline: "WHO: <5g/day total", status: "Harmful" }
            ],
            marketingClaims: [
              { claim: "No MSG added", verdict: "Misleading", verdictLabel: "MISLEADING CLAIM DETECTED", reality: "Contains naturally occurring glutamates from hydrolyzed protein." }
            ],
            adviceCard: {
              primaryAdvice: "Restrict consumption to once per 14-day cycle.",
              consumptionGuideline: "Pair with 200g of fibrous vegetables to mitigate glucose impact."
            }
          }
        },
        {
          id: "SIM-OATS-02",
          product_name: "Quaker Oats (Plain)",
          input_method: "image",
          overall_verdict: "safe",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          analysis_result: {
            productName: "Quaker Oats (Plain)",
            brand: "Quaker",
            overallVerdict: "safe",
            confidenceScore: 98,
            healthImpact: {
              personalizedSummary: "Excellent source of Beta-Glucan fiber. Highly cardioprotective for your lipid profile.",
              personalizedRiskScore: 15
            },
            ingredients: [
              { name: "Whole Grain Oats", standardGuideline: "FSSAI: High Fiber", status: "Acceptable" }
            ],
            marketingClaims: [
              { claim: "Heart Healthy", verdict: "True", verdictLabel: "CLAIM VERIFIED", reality: "Soluble fiber content is clinically proven to reduce LDL cholesterol." }
            ],
            adviceCard: {
              primaryAdvice: "Optimal for daily metabolic stability.",
              consumptionGuideline: "Ideal pre-workout or breakfast staple."
            }
          }
        }
      ]);
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="bg-surface text-on-surface min-h-screen tonal-layering" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', position: 'relative', overscrollBehaviorX: 'none' }}>
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-3">Scan History</h2>
          <p className="text-on-surface-variant leading-relaxed max-w-2xl text-xs md:text-base opacity-70 mx-auto md:mx-0">
            Review your previous product analyses and clinical insights. Track your dietary progress and maintain ingredient awareness.
          </p>
        </header>

        {/* Search & Filter Bar (Bento Header) */}
        <div className="bg-surface-container-low p-4 rounded-3xl mb-12 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm border border-white/40">
          <div className="relative w-full md:w-96 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-primary shadow-sm text-sm outline-none"
              placeholder="Search products or ingredients..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            <button className="bg-primary text-on-primary px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-transform">
              All Results
            </button>
            <button className="bg-white text-on-surface-variant px-6 py-2 rounded-full text-xs font-bold hover:bg-emerald-50 transition-all border border-emerald-900/5 whitespace-nowrap">
              Lab Safe
            </button>
            <button className="bg-white text-on-surface-variant px-6 py-2 rounded-full text-xs font-bold hover:bg-emerald-50 transition-all border border-emerald-900/5 whitespace-nowrap">
              High Risk
            </button>
          </div>
        </div>

        {/* History Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#005144]/20 border-t-[#005144] rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#005144]/60">Syncing Clinical Records...</p>
          </div>
        ) : scans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {scans.map((scan) => (
              <Link
                key={scan.id}
                to={`/analysis/${scan.id}`}
                state={{ 
                  analysis: scan.analysis_result, 
                  productName: scan.product_name,
                  imageUrl: scan.input_image
                }}
                className="group bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all border-2 border-[#005144]/30 hover:border-[#005144] flex flex-col justify-between min-h-[320px] relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${scan.overall_verdict === 'safe' ? 'bg-emerald-100 text-emerald-700' :
                      scan.overall_verdict === 'limit' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {scan.overall_verdict || 'ANALYZED'}
                    </span>
                    <span className="text-xs text-[#3e4946] font-medium opacity-60">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#f2fcf9] flex items-center justify-center text-[#005144] group-hover:scale-110 transition-transform border border-[#005144]/5">
                      <span className="material-symbols-outlined text-2xl">
                        {scan.input_method === 'barcode' ? 'barcode' :
                          scan.input_method === 'image' ? 'upload_file' :
                            scan.input_method === 'voice' ? 'mic' : 'edit_note'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#141d1c] tracking-tight mb-0.5 line-clamp-1 max-w-[200px]">
                        {scan.product_name || `${scan.input_method.toUpperCase()} SCAN`}
                      </h3>
                      <p className="text-[10px] text-[#005144] font-bold uppercase tracking-widest">
                        ID: {scan.id.slice(0, 8)} | {scan.input_method.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-[#3e4946] line-clamp-3 leading-relaxed mb-6">
                    {scan.analysis_result?.healthImpact?.personalizedSummary || scan.analysis_result?.adviceCard?.primaryAdvice || "Clinical assessment completed via 9-agent pipeline."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#005144]/5">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="w-7 h-7 rounded-full border-2 border-white bg-emerald-50 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${scan.id}${j}`} alt="agent" className="w-full h-full object-cover opacity-80" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[#005144] text-xs font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                    View Report <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-surface-container-low rounded-3xl border-2 border-dashed border-primary/10">
            <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">clinical_notes</span>
            <h3 className="text-2xl font-bold text-on-surface mb-2">No Clinical Records Found</h3>
            <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">Start your first scan to begin generating personalized clinical insights.</p>
            <Link to="/scan" className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all inline-block">
              Initialize First Scan
            </Link>
          </div>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-[70] hidden md:block">
        <Link to="/scan" className="bg-primary text-on-primary w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-primary/30">
          <span className="material-symbols-outlined text-3xl">barcode_scanner</span>
        </Link>
      </div>
    <Footer />
    </div>
  );
};

export default HistoryPage;
