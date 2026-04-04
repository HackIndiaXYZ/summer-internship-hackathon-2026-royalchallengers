import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // HEURISTIC WARMUP: Ping the backend health endpoint on mount to wake up 
  // serverless DB connections while the user starts typing.
  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/health`)
      .then(() => console.log('[System] Pipeline Pre-warmed'))
      .catch(() => { });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let success = false;
      if (isLogin) {
        success = await login(email, password);
      } else {
        success = await register(name, email, password);
      }

      if (success) {
        navigate('/');
      } else {
        setError(isLogin ? 'Invalid ID or credentials. Please verify and retry.' : 'Specialist registration failed. ID may already exist.');
      }
    } catch (err) {
      setError('Connection disrupted. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f2fcf9] text-[#141d1c] min-h-screen flex flex-col md:flex-row font-['Inter'] overflow-hidden">
      {/* Left Column: Clinical Hero & Trust Branding */}
      <section className="relative w-full md:w-1/2 min-h-[40vh] md:min-h-screen flex items-center justify-center p-8 md:p-16 overflow-hidden">
        {/* The Medo Veda Hero Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/auth-hero.png"
            alt="Clinical Intelligence"
            className="w-full h-full object-cover"
          />
          {/* Emerald Clinical Overlay - Adjusting transparency for 'top notch' look */}
          <div className="absolute inset-0 bg-[#005144]/85 mix-blend-multiply backdrop-blur-[2px]"></div>

          {/* Narrative Grain / Noise Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-tight mb-6 shadow-sm">
              Evidence-Based Clinical Decision Support.
            </h1>

            <p className="text-[#a5e9d9] text-base md:text-lg leading-relaxed mb-12 opacity-80 max-w-sm">
              High-fidelity intelligence for clinical researchers, ensuring precision and safety in patient data processing.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: 'shield_person', label: 'HIPAA Compliant', status: 'Active Protocol' },
                { icon: 'verified', label: 'SOC2 Certified', status: 'Evaluated v4.2' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + (i * 0.2) }}
                  className="bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all duration-500 cursor-default group"
                >
                  <span className="material-symbols-outlined text-[#78fac3] mb-4 text-3xl group-hover:scale-110 transition-transform duration-500">{item.icon}</span>
                  <h3 className="text-white font-bold text-sm mb-1">{item.label}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <p className="text-[#83d6c2] text-[9px] font-black uppercase tracking-widest opacity-60">{item.status}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Right Column: Authentication Interface */}
      <section className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-16 lg:p-24 bg-[#f2fcf9] relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-10 md:mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-[#141d1c] tracking-tighter mb-4 leading-none text-center md:text-left">
              {isLogin ? "Medical ID Login." : "Welcome Back"}
            </h2>
            <p className="text-[#3e4946] text-xs md:text-sm font-medium tracking-tight opacity-70 text-center md:text-left">
              {isLogin ? "Secure access to clinical evaluation pipelines." : "Initiating specialist accreditation procedure."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="mb-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-2xl flex items-center gap-4 shadow-sm"
              >
                <span className="material-symbols-outlined text-red-500 text-xl">error_med</span>
                <p className="text-red-900 text-[10px] font-black uppercase tracking-[0.1em]">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-[10px] font-black text-[#141d1c] uppercase tracking-widest mb-2 ml-1" htmlFor="name">Full Clinical Identity</label>
                <input
                  className="w-full px-6 py-5 bg-white border border-[#005144]/10 rounded-[1.5rem] text-[#141d1c] focus:ring-4 focus:ring-[#005144]/5 focus:border-[#005144] transition-all placeholder:text-[#303a38]/20 shadow-sm font-medium"
                  id="name"
                  type="text"
                  placeholder="e.g. Dr. Julian Veda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </motion.div>
            )}

            <motion.div layout>
              <label className="block text-[10px] font-black text-[#141d1c] uppercase tracking-widest mb-2 ml-1" htmlFor="email">Registry Email Endpoint</label>
              <input
                className="w-full px-6 py-5 bg-white border border-[#005144]/10 rounded-[1.5rem] text-[#141d1c] focus:ring-4 focus:ring-[#005144]/5 focus:border-[#005144] transition-all placeholder:text-[#303a38]/20 shadow-sm font-medium"
                id="email"
                type="email"
                placeholder="protocol@medoveda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>

            <motion.div layout>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-black text-[#141d1c] uppercase tracking-widest" htmlFor="password">Encrypted Passkey</label>
                {isLogin && <Link to="#" className="text-[10px] font-black text-[#005144] uppercase tracking-widest hover:text-emerald-700 transition-colors">Reset</Link>}
              </div>
              <div className="relative group">
                <input
                  className="w-full px-6 py-5 bg-white border border-[#005144]/10 rounded-[1.5rem] text-[#141d1c] focus:ring-4 focus:ring-[#005144]/5 focus:border-[#005144] transition-all placeholder:text-[#303a38]/20 shadow-sm font-medium"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-[#303a38]/30 hover:text-[#005144] transition-all"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </motion.div>

            <button
              disabled={isLoading}
              className="group relative w-full py-5 bg-[#005144] hover:bg-[#003d33] disabled:opacity-50 text-white font-black rounded-[1.5rem] transition-all shadow-xl shadow-[#005144]/20 active:scale-[0.98] flex items-center justify-center gap-4 overflow-hidden"
              type="submit"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-[200%] group-hover:translate-x-[300%] transition-transform duration-1000"></div>

              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span className="uppercase tracking-[0.2em] text-[10px]">Verifying Protocol...</span>
                </>
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-[10px]">{isLogin ? "Authenticate Session" : "Authorize Specialist"}</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-14 pt-8 border-t border-[#005144]/5 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3e4946] hover:text-[#005144] transition-colors inline-flex items-center gap-2 group"
            >
              {isLogin ? "New Clinical Practitioner?" : "Existing Medical Researcher?"}
              <span className="text-[#005144] group-hover:underline underline-offset-4">{isLogin ? "Join Network" : "Sign In Portal"}</span>
            </button>
          </div>
        </motion.div>

        {/* Clinical Disclaimer / Footer */}
        <div className="w-full px-8 md:px-16 mt-16 md:absolute md:bottom-10 md:left-0 md:right-0 flex flex-row items-center justify-between opacity-30 pointer-events-none select-none">
          <span className="text-[7px] font-black uppercase tracking-[0.6em] text-[#005144]">Clinical Intelligence Unit v2.4.0</span>
          <div className="h-[1px] flex-1 mx-4 md:mx-8 bg-[#005144]/20"></div>
          <span className="material-symbols-outlined text-sm text-[#005144]">security</span>
        </div>
      </section>
    </div>

  );
};

export default AuthPage;
