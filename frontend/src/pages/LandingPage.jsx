import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const revealRefs = useRef([]);
  revealRefs.current = [];

  const addToRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, observerOptions);

    revealRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#F8FBFA] text-on-surface antialiased selection:bg-primary-fixed-dim selection:text-on-primary-fixed overflow-x-hidden min-h-screen">
      <main className="pb-24 md:pb-0">
        {/* Grand Hero Section */}
        <section className="relative pt-24 pb-12 md:pt-48 md:pb-40 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
            <div className="animate-fade-in-up [animation-delay:200ms] opacity-0 flex items-center space-x-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-primary/10 mb-8">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Clinical Grade Intelligence</span>
            </div>
            <h1 className="animate-fade-in-up [animation-delay:400ms] opacity-0 text-4xl md:text-8xl font-black text-on-surface tracking-tighter leading-[0.95] max-w-4xl mb-6 md:mb-8">
              Know <span className="text-primary">What</span> You Eat
            </h1>
            <p className="animate-fade-in-up [animation-delay:600ms] opacity-0 text-base md:text-xl text-on-surface-variant/80 leading-relaxed max-w-2xl mb-10 md:mb-12">
              Analyze ingredients against global health standards with clinical precision. Medo Veda gives you the definitive verdict on every bite.
            </p>
            <div className="animate-fade-in-up [animation-delay:800ms] opacity-0 flex flex-col sm:flex-row gap-4 md:gap-5 mb-16 md:mb-24 w-full sm:w-auto">
              <Link to={user ? "/scan" : "/auth"} className="flex items-center justify-center space-x-3 bg-primary text-on-primary px-8 md:px-10 py-4 md:py-5 rounded-full font-bold text-base md:text-lg hover:shadow-[0_8px_30px_rgb(0,81,68,0.3)] transition-all hover:-translate-y-1">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <span>{user ? "Go to Scan Lab" : "Get Started"}</span>
              </Link>
              <button className="flex items-center justify-center space-x-3 bg-white text-primary border border-primary/10 px-8 md:px-10 py-4 md:py-5 rounded-full font-bold text-base md:text-lg hover:bg-emerald-50 transition-all">
                <span>Explore Science</span>
              </button>
            </div>

            {/* Floating Mockup Layer */}
            <div className="animate-scale-in [animation-delay:1000ms] opacity-0 relative w-full max-w-5xl mx-auto px-0 md:px-4">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.12)] bg-white border border-white p-2">
                <img
                  alt="App Interface Mockup"
                  className="w-full rounded-xl md:rounded-2xl"
                  src="/hero.png"
                />
              </div>

              {/* Floating Elements (Hidden on small mobile for clarity) */}
              <div className="absolute -top-12 -left-4 md:-left-12 bg-white/95 backdrop-blur-xl p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl border border-primary/5 hidden sm:block max-w-[180px] md:max-w-[240px] text-left">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Health Index</span>
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500"></div>
                </div>
                <div className="text-3xl md:text-4xl font-black text-primary tracking-tighter mb-1">94<span className="text-xs md:text-sm opacity-40">/100</span></div>
                <p className="text-[10px] md:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 rounded-full inline-block">Safe Grade</p>
              </div>

              <div className="absolute -bottom-8 -right-4 md:-right-10 bg-primary p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl hidden sm:block max-w-[160px] md:max-w-[200px] text-left">
                <div className="flex items-center space-x-2 md:space-x-3 mb-1 md:mb-2 text-on-primary">
                  <span className="material-symbols-outlined text-xl md:text-2xl">biotech</span>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Verified</span>
                </div>
                <p className="text-[10px] md:text-xs text-on-primary/80 leading-relaxed font-medium">Synced with WHO guidelines.</p>
              </div>
            </div>

            {/* Partners/Trust */}
            <div className="mt-16 md:mt-32 pt-12 border-t border-emerald-900/5 w-full">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 mb-8 md:mb-10 text-center">Global Compliance Partners</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-30 grayscale scale-75 md:scale-100">
                <span className="font-black text-xl md:text-2xl tracking-tighter">WHO</span>
                <span className="font-black text-xl md:text-2xl tracking-tighter">FSSAI</span>
                <span className="font-black text-xl md:text-2xl tracking-tighter">FDA</span>
                <span className="font-black text-xl md:text-2xl tracking-tighter">ISO-22000</span>
                <span className="font-black text-xl md:text-2xl tracking-tighter">EFSA</span>
              </div>
            </div>
          </div>

          {/* Background Decorative */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none opacity-40">
            <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-emerald-100/50 rounded-full blur-[100px] md:blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] md:blur-[100px]"></div>
          </div>
        </section>

        {/* DEMO GALLERY: Horizontal Scroll (Mobile Erasure Padding) */}
        <section className="reveal reveal-up py-12 md:py-20 active" ref={addToRefs}>
          <div className="max-w-7xl mx-auto px-6 mb-8 md:mb-12">
            <span className="text-primary font-bold text-xs md:text-sm uppercase tracking-widest text-[#006b5b]">Global Database</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-on-surface leading-tight mt-2 pb-2">
              Real-Time Ingredient Audit
            </h2>
          </div>

          <div className="flex overflow-x-auto gap-4 md:gap-6 px-6 pb-12 no-scrollbar scroll-smooth snap-x snap-mandatory">
            {[
              { img: "/botanical.png", title: "Botanical Extracts", desc: "Syncing molecular markers with clinical research for organic compounds." },
              { img: "/phytonutrient.png", title: "Phyto-Log", desc: "Analyzing antioxidant density and verified bioavailability for berries." },
              { img: "/lipid.png", title: "Lipid Intelligence", desc: "Scanning fatty acid profiles against cardiac standards." },
              { img: "/lab.png", title: "Additive Detection", desc: "Automated indexing of 3,000+ synthetic preservatives and dyes." }
            ].map((item, idx) => (
              <div key={idx} className="flex-none w-[280px] md:w-[340px] snap-center">
                <div className="rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white shadow-xl h-[340px] md:h-[380px] relative group border border-white/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6 md:p-8 flex flex-col justify-end">
                    <h3 className="text-lg md:text-xl font-black text-white mb-1 leading-none uppercase tracking-tighter">{item.title}</h3>
                    <p className="text-[10px] md:text-xs text-white/70 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature 1: Responsive Stacking */}
        <section className="reveal reveal-up py-16 md:py-32 active" ref={addToRefs}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="relative group">
              <div className="rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-surface-container-low aspect-[4/3] relative border-4 border-white">
                <img
                  alt="Laboratory Analysis"
                  className="w-full h-full object-cover"
                  src="/lab.png"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-primary/5 max-w-[200px] md:max-w-[240px] hidden sm:block">
                <span className="material-symbols-outlined text-primary text-3xl md:text-4xl mb-3 md:mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
                <h4 className="font-bold text-on-surface text-sm md:text-base mb-1 md:mb-2 leading-none">Additive Detection</h4>
                <p className="text-[10px] md:text-xs text-on-surface-variant leading-relaxed">Exposing 3,000+ hidden chemicals.</p>
              </div>
            </div>
            <div className="space-y-6 md:space-y-8 text-left">
              <span className="text-primary font-bold text-xs md:text-sm uppercase tracking-widest">Precision Analysis</span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-on-surface leading-tight">
                Our AI doesn't just read—it understands.
              </h2>
              <p className="text-base md:text-lg text-on-surface-variant leading-relaxed">
                Identify hidden preservatives and synthetic dyes that standard labels disguise. We cross-reference every ingredient against metabolic research.
              </p>
              <div className="pt-2">
                <Link to="/scan" className="flex items-center space-x-2 text-primary font-bold group text-sm md:text-base">
                  <span className="border-b-2 border-primary/20 group-hover:border-primary transition-all">Start your first evaluation</span>
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Bento Stacking */}
        <section className="reveal reveal-up py-16 md:py-32 bg-white active" ref={addToRefs}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12">
              <div className="lg:col-span-12 text-center mb-6 md:mb-10">
                <span className="text-primary font-bold text-xs md:text-sm uppercase tracking-widest text-[#006b5b]">Dynamic Profiling</span>
                <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-on-surface leading-tight mt-3">
                  Benchmarked to you.
                </h2>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center space-y-6 md:space-y-8">
                <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed">
                  Medo Veda adjusts its intelligence based on your specific health markers—allergies and chronic conditions.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                  <div className="space-y-2 p-6 bg-[#F2FCF9] rounded-3xl border border-primary/5">
                    <div className="flex items-center space-x-2 text-primary font-bold text-sm">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>Biomarker Sync</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Real-time insulin response prediction.</p>
                  </div>
                  <div className="space-y-2 p-6 bg-[#F2FCF9] rounded-3xl border border-primary/5">
                    <div className="flex items-center space-x-2 text-primary font-bold text-sm">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>Toxicology</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Scanning for chemical exposure.</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <div className="bg-[#F2FCF9] rounded-[2rem] md:rounded-[2.5rem] flex flex-col shadow-sm h-[220px] md:h-[260px] relative overflow-hidden group border border-primary/5">
                  <img
                    src="https://images.unsplash.com/photo-1555436169-20e93ea9a7ff?auto=format&fit=crop&q=80&w=800"
                    alt="Health Log"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 filter grayscale-[50%] group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full">
                    <div className="w-10 h-10 rounded-full border border-primary/10 flex items-center justify-center bg-white shadow-sm">
                      <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black mb-1 tracking-tighter uppercase leading-none">Health Log</h3>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed opacity-80">Track molecular load and choices.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary text-on-primary rounded-[2rem] md:rounded-[2.5rem] flex flex-col shadow-2xl h-[220px] md:h-[260px] relative overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=800"
                    alt="Verdict Engine"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-primary/20 pointer-events-none"></div>
                  <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full">
                    <div className="bg-white/10 w-fit p-2.5 rounded-xl">
                      <span className="material-symbols-outlined text-white text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black mb-1 tracking-tighter uppercase leading-none">Verdict Engine</h3>
                      <p className="text-[10px] text-on-primary/70 leading-relaxed font-medium">Safe, Limit, or Avoid based on profile.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Card Grid: Clinical Standards (Vocabulary Requirement) */}
        <section className="reveal reveal-up py-20 bg-[#F2FCF9]/50 active" ref={addToRefs}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-primary font-bold text-xs uppercase tracking-[0.3em]">Scientific Rigor</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-on-surface mt-3 mb-6">
                Our Three Pillars of Safety.
              </h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto text-lg leading-relaxed">
                Medo Veda operates on a multi-layered verification protocol used by top-tier medical facilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  img: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800",
                  title: "Molecular Validation",
                  desc: "We analyze the chemical structure of additives to predict inflammatory responses with 99.4% precision.",
                  icon: "biotech"
                },
                {
                  img: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=800",
                  title: "Clinical Reference",
                  desc: "Every verdict is cross-referenced against 50,000+ peer-reviewed metabolic studies and global health databases.",
                  icon: "microscope"
                },
                {
                  img: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=800",
                  title: "Real-time Monitoring",
                  desc: "Our engine tracks emerging FDA/WHO alerts instantly, ensuring your data is never based on outdated research.",
                  icon: "network_node"
                }
              ].map((card, i) => (
                <div key={i} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-primary/5 mx-auto max-w-[360px]">
                  <div className="h-40 overflow-hidden relative">
                    <img src={card.img} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-6 bg-primary text-white p-2 rounded-xl shadow-lg">
                      <span className="material-symbols-outlined text-[16px]">{card.icon}</span>
                    </div>
                  </div>
                  <div className="p-6 pt-3">
                    <h3 className="text-lg font-black text-[#005144] tracking-tight mb-2 uppercase">{card.title}</h3>
                    <p className="text-xs text-[#3e4946] leading-relaxed opacity-80">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}

        <section className="reveal reveal-up py-16 md:py-32 px-6 active" ref={addToRefs}>
          <div className="max-w-7xl mx-auto rounded-[2.5rem] md:rounded-[3.5rem] bg-primary relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-[-10%] left-[-5%] w-[40%] aspect-square rounded-full border-[40px] md:border-[60px] border-white"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] aspect-square rounded-full border-[30px] md:border-[40px] border-white"></div>
            </div>

            <div className="relative z-10 p-10 md:p-32 text-center max-w-4xl mx-auto space-y-8 md:space-y-10">
              <h2 className="text-4xl md:text-7xl font-semibold text-on-primary tracking-tight leading-none">
                Clinical Clarity.
              </h2>
              <p className="text-lg md:text-xl text-on-primary-container opacity-90 leading-relaxed max-w-2xl mx-auto">
                Trust Medo Veda for your daily nutritional verification.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 pt-6 md:pt-10">
                <Link to="/scan" className="bg-white text-primary px-8 md:px-12 py-4 md:py-6 rounded-full font-black text-lg md:text-xl hover:shadow-2xl transition-all active:scale-95">
                  Launch Analysis Lab
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
