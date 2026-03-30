import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import ProfileSetup from "./ProfileSetup";
import Footer from "../components/Footer";

const Dashboard = () => {
  const { user } = useAuth();
  const [realScans, setRealScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    healthScore: 0,
    aiInsight: {
      insight: "Personalized dashboard initialization in progress.",
      suggestion: "Perform a quick scan lab test.",
      scoreColor: "#e2e8f0"
    },
    stats: {
      totalScans: 0,
      vitals: "--",
      sleep: "--",
      recovery: "--",
      activity: "--"
    }
  });

  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch real user-specific data from real-time endpoints
          const [scansRes, summaryRes] = await Promise.all([
            axios.get(`http://localhost:3001/api/scans/${user.id}`).catch(() => ({ data: [] })),
            axios.get(`http://localhost:3001/api/dashboard/summary/${user.id}`).catch(() => ({ data: null }))
          ]);
          
          setRealScans(scansRes.data);
          
          // If we have actual dashboard summary data, use it
          if (summaryRes.data && summaryRes.data.healthScore) {
            setDashboardData(summaryRes.data);
            setHasData(true);
          } else if (scansRes.data.length > 0) {
            // Even if no summary, if we have scans, we can calculate some data
            setHasData(true);
            // In a real app, logic here would aggregate scan data
          } else {
            // User logged in but no data yet - keep default empty state
            setHasData(false);
          }
        } catch (err) {
          console.error("Dashboard Fetch Error:", err);
          setHasData(false);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      // Mock data for non-logged in users (demo mode)
      setDashboardData({
        healthScore: 80,
        aiInsight: {
          insight: "Sample analysis showing optimal metabolic markers.",
          suggestion: "Maintain current clinical protocols.",
          scoreColor: "#006b5b"
        },
        stats: {
          totalScans: 12,
          vitals: "94%",
          sleep: "78%",
          recovery: "81%",
          activity: "64%"
        }
      });
      setHasData(true);
    }
  }, [user]);

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen tonal-layering">
      <style>
        {`
          .tonal-layering {
            background-image: radial-gradient(at top left, rgba(0, 107, 91, 0.03) 0%, transparent 50%);
          }
          .bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 1.5rem;
          }
        `}
      </style>


      <main className="pt-20 md:pt-24 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
            <div>
              <div className="flex items-center gap-4 mb-1">
                <p className="text-on-surface-variant font-medium tracking-wide">
                  {user ? `Welcome back, ${user.name}` : "Welcome back, Physician-001"}
                </p>
                {!user && (
                  <Link to="/auth" className="bg-[#005144] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse hover:scale-105 transition-all">
                    Get Started
                  </Link>
                )}
                {user && (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Live Analysis Active
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">Clinical Overview</h1>
            </div>
            <Link to="/scan" className="flex items-center justify-center gap-2 bg-[#005144] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-all w-full md:w-auto">
              <span className="material-symbols-outlined">add_circle</span>
              Quick Scan Lab
            </Link>
          </div>
        </header>

        {/* Bento Grid Dashboard */}
        {!hasData && user ? (
          <div className="bg-white/40 backdrop-blur-md border-2 border-dashed border-[#005144]/10 rounded-3xl md:rounded-[2.5rem] p-8 md:p-20 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 bg-[#005144]/5 rounded-full flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-[#005144] text-5xl animate-pulse">biotech</span>
            </div>
            <h2 className="text-3xl font-bold text-[#141d1c] mb-4">Awaiting Clinical Calibration</h2>
            <p className="text-[#3e4946] max-w-lg mx-auto mb-12 text-lg font-medium opacity-80">
              Your high-fidelity diagnostic dashboard is currently in standby. Perform your first specimen scan or complete your biometric profile to generate real-time biological insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
              <Link to="/scan" className="bg-[#005144] text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-all outline-none w-full sm:w-auto">
                Access Scan Lab
              </Link>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="bg-white/50 backdrop-blur-sm text-[#005144] border border-[#005144]/20 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg hover:bg-[#005144]/5 transition-all outline-none w-full sm:w-auto"
              >
                Complete Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Health Score Visualization (Main Tile) */}
          <section className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-[2rem] lg:rounded-3xl p-6 md:p-10 shadow-[0_2px_24px_rgba(0,107,91,0.08)] relative overflow-hidden group border border-primary/5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-on-surface mb-1 tracking-tight">Overall Health Score</h2>
                <p className="text-on-surface-variant text-xs lg:text-sm font-medium opacity-70">Aggregated from recent biometric scans</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                  +2.4% vs last week
                </div>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-[#005144] border-b border-[#005144]/20 pb-0.5"
                >
                  Edit Bio-Data
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-around py-4 lg:py-8 gap-8 lg:gap-12">
              {/* Donut Chart */}
              <div className="relative w-40 h-40 lg:w-52 lg:h-52 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-surface-container" cx="50%" cy="50%" fill="transparent" r="44%" stroke="currentColor" strokeWidth="12" />
                  <circle 
                    className="transition-all duration-1000 ease-out" 
                    cx="50%" cy="50%" fill="transparent" r="44%" 
                    stroke={dashboardData.aiInsight.scoreColor} 
                    strokeWidth="12" 
                    strokeDasharray="276" 
                    strokeDashoffset={276 - (276 * dashboardData.healthScore / 100)} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl lg:text-6xl font-black text-on-surface tracking-tighter">{dashboardData.healthScore}</span>
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">{dashboardData.healthScore > 75 ? 'Optimal' : dashboardData.healthScore > 50 ? 'Stable' : 'Risk'}</span>
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Vitals</p>
                    <p className="text-xl lg:text-2xl font-black text-on-surface tracking-tighter">{dashboardData.stats.vitals}</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Sleep</p>
                    <p className="text-xl lg:text-2xl font-black text-on-surface tracking-tighter">{dashboardData.stats.sleep}</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Recovery</p>
                    <p className="text-xl lg:text-2xl font-black text-on-surface tracking-tighter">{dashboardData.stats.recovery}</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-primary/5">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Activity</p>
                    <p className="text-xl lg:text-2xl font-black text-on-surface tracking-tighter">{dashboardData.stats.activity}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Intelligence Tooltip Tile */}
          <section className="col-span-12 lg:col-span-4 bg-inverse-surface rounded-[2rem] lg:rounded-3xl p-6 md:p-10 text-on-primary-container shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px] lg:min-h-0">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl lg:text-8xl">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-white mb-4 lg:mb-6 tracking-tight">AI Insight</h2>
              <p className="text-emerald-100/80 leading-relaxed mb-6 lg:mb-8 text-sm lg:text-base font-medium">
                {dashboardData.aiInsight.insight}
              </p>
            </div>
            <div className="p-4 lg:p-5 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-400 text-lg">lightbulb</span>
                <span className="text-[10px] lg:text-xs font-black text-white uppercase tracking-widest leading-tight">Recommended Action: <span className="text-emerald-300 font-medium normal-case tracking-normal text-sm block mt-1">{dashboardData.aiInsight.suggestion}</span></span>
              </div>
            </div>
          </section>

          {/* Recent Scans List */}
          <section className="col-span-12 bg-surface-container-low rounded-xl p-8">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                {user ? "Clinical Diagnostic History" : "Simulated Laboratory Records"}
              </h2>
              <Link to="/history" className="text-primary font-bold text-sm hover:underline">View Full Reports</Link>
            </div>
            <div className="space-y-4">
              {user ? (
                realScans.length > 0 ? (
                  realScans.map((scan) => (
                    <Link key={scan.id} to={`/analysis/${scan.id}`} className="bg-surface-container-lowest p-6 rounded-xl flex flex-wrap md:flex-nowrap items-center gap-6 shadow-sm hover:shadow-md transition-all group">
                      {/* Real scan rendering code */}
                      <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl">
                          {scan.input_method === 'barcode' ? 'barcode' :
                            scan.input_method === 'image' ? 'image' :
                              scan.input_method === 'voice' ? 'mic' : 'description'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="font-bold text-on-surface">{scan.product_name || "Clinical Analysis"}</h3>
                        <p className="text-sm text-on-surface-variant">Completed {new Date(scan.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${(scan.overall_verdict || 'limit') === 'safe' ? 'bg-green-100 text-green-700' :
                            (scan.overall_verdict || 'limit') === 'limit' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {(scan.overall_verdict || 'limit').toUpperCase()}
                        </span>
                        <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-20 bg-surface-container-low rounded-xl border-2 border-dashed border-primary/20">
                    <span className="material-symbols-outlined text-5xl text-primary/30 mb-4">clinical_notes</span>
                    <h3 className="text-xl font-bold text-on-surface mb-2">No Records Found</h3>
                    <p className="text-on-surface-variant mb-6">Initialize your first scan to generate data.</p>
                    <Link to="/scan" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold inline-block">Start Scan</Link>
                  </div>
                )
              ) : (
                <>
                  {/* Mock Data for Guests */}
                  {[1, 2].map((m) => (
                    <div key={m} className="bg-surface-container-lowest p-6 rounded-xl flex items-center gap-6 opacity-60 grayscale-[0.5]">
                      <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-3xl">biotech</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-on-surface">{m === 1 ? "Sample Formulation #A" : "Laboratory Reference #B"}</h3>
                        <p className="text-sm text-on-surface-variant">Simulated Record</p>
                      </div>
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-surface-container-high text-outline">GUEST PREVIEW</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>

          {/* Bottom Editorial Cards */}
          <div className="col-span-12 md:col-span-6 rounded-xl overflow-hidden relative min-h-[300px] flex items-end p-8 group">
            <img
              alt="Lab High-Tech"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIos4esTp37xO0Wfv0t8etjrXGFuF-XTRhKjbxLeK7e3ZKQPV2WA2LcYuuvZr9ubIwraAWCnxastTSnztCpRFOVZYV4Vv6BMygPsPgm2clHru-QDmRPXLkmr9Smlwd5jSMlhXtSR97Fgo0kwjChZAW6vWmU7YmLhjvJXSGgumGUg_f9hwE9NItScnraH3MxuQBe6JCv0cm0JBX8m6_UlyN8CZbuAxZIHDIeL4WWP_MnoWJ8y8IJeL76SKUV-SA07Nu7gkcf5sEG0Y"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-white text-2xl font-bold mb-2">New Research Available</h3>
              <p className="text-emerald-100/80 mb-4 text-sm max-w-sm font-medium">Deep dive into the latest findings on neuro-plasticity and cortisol regulation.</p>
              <button className="text-white font-bold border-b-2 border-white pb-1 text-sm hover:opacity-80 transition-opacity">Read Publication</button>
            </div>
          </div>
          <div className="col-span-12 md:col-span-6 bg-secondary-fixed rounded-xl p-8 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-on-secondary-fixed text-2xl font-black mb-4 tracking-tight">Veda Membership</h3>
              <p className="text-on-secondary-fixed-variant leading-relaxed">Unlock advanced DNA sequencing and real-time clinical consultations with our top-tier network.</p>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <span className="text-on-secondary-fixed font-bold">Starting at $49/mo</span>
              <button className="bg-on-secondary-fixed text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95">Upgrade Now</button>
            </div>
          </div>
        </div>
      )}
    </main>
      
      {/* Bio-Profile Modal */}
      <Modal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        title="Clinical Profile Setup"
      >
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar -mx-8 px-8">
          <ProfileSetup isModal={true} onComplete={() => setIsProfileModalOpen(false)} />
        </div>
      </Modal>

    <Footer />
    </div>
  );
};

export default Dashboard;
