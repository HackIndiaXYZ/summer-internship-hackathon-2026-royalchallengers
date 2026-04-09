import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const ProfileSetup = ({ isModal = false, onComplete }) => {
  const navigate = useNavigate();
  const { user, updateUser, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savedProfile, setSavedProfile] = useState(null);

  // Step 1: Basic Details
  const [basicInfo, setBasicInfo] = useState({
    age: '',
    gender: 'unspecified',
    weight: '',
    height: '',
    activityLevel: ''
  });

  // Step 2: Health Conditions
  const [selectedConditions, setSelectedConditions] = useState([]);

  // Step 3: Health Goals
  const [selectedGoals, setSelectedGoals] = useState([]);

  const labelize = (value) =>
    String(value || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`${API_URL}/api/profile/${user.id}`);
        const p = res.data?.persona;
        if (p) {
          setSavedProfile(p);
          setBasicInfo({
            age: p.age?.toString() || '',
            gender: p.gender || 'unspecified',
            weight: p.weight?.toString() || '',
            height: p.height?.toString() || '',
            activityLevel: p.dietary_preferences?.[0] || ''
          });
          if (p.health_conditions) setSelectedConditions(p.health_conditions);
          if (p.health_goals) setSelectedGoals(p.health_goals);
          
          // Optionally skip straight to dashboard if accessing via route and fully complete - but wait, 
          // the user might be trying to "Edit Bio-Data", so we shouldn't redirect automatically.
        }
      } catch (err) {
        console.error('Failed to load profile context', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  const conditions = [
    { id: 'diabetes', label: 'Diabetes', icon: 'bloodtype' },
    { id: 'hypertension', label: 'Hypertension', icon: 'monitor_heart' },
    { id: 'high_cholesterol', label: 'High Cholesterol', icon: 'water_drop' },
    { id: 'heart_disease', label: 'Heart Disease', icon: 'cardiology' },
    { id: 'kidney_disease', label: 'Kidney Disease', icon: 'nephrology' },
    { id: 'obesity', label: 'Obesity', icon: 'fitness_center' },
    { id: 'celiac_disease', label: 'Celiac Disease', icon: 'no_food' },
    { id: 'lactose_intolerance', label: 'Lactose Intolerance', icon: 'local_cafe' },
    { id: 'pcos', label: 'PCOS', icon: 'female' },
    { id: 'thyroid', label: 'Thyroid Disorder', icon: 'thermometer' },
    { id: 'asthma', label: 'Asthma', icon: 'pulmonology' },
    { id: 'none', label: 'None of the above', icon: 'check_circle' }
  ];

  const goals = [
    { id: 'lose_weight', label: 'Lose Weight', icon: 'trending_down' },
    { id: 'reduce_sugar', label: 'Reduce Sugar Intake', icon: 'no_drinks' },
    { id: 'lower_bp', label: 'Lower Blood Pressure', icon: 'show_chart' },
    { id: 'build_muscle', label: 'Build Muscle', icon: 'fitness_center' },
    { id: 'gut_health', label: 'Improve Gut Health', icon: 'gastroenterology' },
    { id: 'manage_diabetes', label: 'Manage Diabetes', icon: 'bloodtype' },
    { id: 'eat_cleaner', label: 'Eat Cleaner', icon: 'eco' },
    { id: 'reduce_processed', label: 'Reduce Processed Food', icon: 'block' },
    { id: 'general_awareness', label: 'General Awareness', icon: 'visibility' }
  ];

  const toggleCondition = (id) => {
    if (id === 'none') {
      setSelectedConditions(['none']);
      return;
    }
    setSelectedConditions(prev => {
      const filtered = prev.filter(c => c !== 'none');
      return filtered.includes(id) ? filtered.filter(c => c !== id) : [...filtered, id];
    });
  };

  const toggleGoal = (id) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const canProceedStep1 = basicInfo.age && basicInfo.gender !== 'unspecified';
  const canProceedStep2 = selectedConditions.length > 0;
  const canComplete = selectedGoals.length > 0;

  const handleComplete = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setSaving(true);
    try {
      const profilePayload = {
        user_id: user.id,
        age: parseInt(basicInfo.age) || 25,
        gender: basicInfo.gender,
        health_conditions: selectedConditions.filter(c => c !== 'none'),
        health_goals: selectedGoals,
        dietary_preferences: [basicInfo.activityLevel].filter(Boolean),
        weight: parseFloat(basicInfo.weight) || null,
        height: parseFloat(basicInfo.height) || null
      };

      await axios.post(`${API_URL}/api/profile/setup`, {
        ...profilePayload
      });

      // Update user context with fresh profile data
      const refreshed = await refreshProfile();
      setSavedProfile(refreshed || profilePayload);

      toast.success('Clinical parameters updated successfully.', {
        duration: 3500,
        style: {
          background: '#005144',
          color: '#fff',
          fontWeight: 600,
          borderRadius: '16px',
        }
      });

      if (onComplete) {
        onComplete();
      } else {
        setStep(1);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Clinical handshake protocol failed.');
      setSaving(false);
    }
  };

  const stepLabels = ['Basic Details', 'Health Conditions', 'Clinical Goals'];

  if (loadingProfile) {
    return (
      <div className={`flex items-center justify-center ${isModal ? 'h-[50vh]' : 'min-h-screen bg-[#f2fcf9]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#005144]/20 border-t-[#005144] rounded-full animate-spin"></div>
          <span className="text-[#005144] font-bold text-sm tracking-widest uppercase">Loading Context...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={isModal ? "" : "min-h-screen bg-[#f2fcf9] font-body text-[#141d1c] antialiased"}>
      <main className={isModal ? "p-0" : "pt-24 sm:pt-28 pb-20 px-3 sm:px-6 max-w-2xl mx-auto"}>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141d1c] tracking-tight mb-3">
            Complete Your Profile
          </h1>
          <p className="text-[#3e4946] text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Tell us about yourself. This takes 60 seconds and makes every analysis more relevant to you.
          </p>
        </div>

        {/* Saved Profile Card */}
        {savedProfile && (
          <section className="mb-8 bg-white rounded-3xl border border-[#005144]/10 shadow-[0_2px_20px_rgba(0,81,68,0.08)] overflow-hidden">
            <div className="bg-[#005144] text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">Health Profile</h2>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.14em] text-emerald-100/80 font-bold">Saved Permanently</p>
              </div>
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-emerald-200">verified_user</span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#f2fcf9] rounded-2xl p-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#3e4946]/60">Age</p>
                  <p className="text-lg font-black text-[#141d1c]">{savedProfile.age || '--'}</p>
                </div>
                <div className="bg-[#f2fcf9] rounded-2xl p-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#3e4946]/60">Gender</p>
                  <p className="text-lg font-black text-[#141d1c]">{labelize(savedProfile.gender) || '--'}</p>
                </div>
                <div className="bg-[#f2fcf9] rounded-2xl p-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#3e4946]/60">Weight</p>
                  <p className="text-lg font-black text-[#141d1c]">{savedProfile.weight ? `${savedProfile.weight} kg` : '--'}</p>
                </div>
                <div className="bg-[#f2fcf9] rounded-2xl p-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#3e4946]/60">Height</p>
                  <p className="text-lg font-black text-[#141d1c]">{savedProfile.height ? `${savedProfile.height} cm` : '--'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#f8fbfa] rounded-2xl p-3.5 border border-[#005144]/8">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#3e4946]/60 mb-2">Activity Level</p>
                  <p className="text-sm font-bold text-[#141d1c]">{labelize(savedProfile.dietary_preferences?.[0]) || '--'}</p>
                </div>

                <div className="bg-[#f8fbfa] rounded-2xl p-3.5 border border-[#005144]/8">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#3e4946]/60 mb-2">Health Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {(savedProfile.health_conditions?.length ? savedProfile.health_conditions : ['none']).map((condition) => (
                      <span key={condition} className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.08em] bg-[#005144]/8 text-[#005144]">
                        {labelize(condition)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#f8fbfa] rounded-2xl p-3.5 border border-[#005144]/8">
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#3e4946]/60 mb-2">Health Goals</p>
                  <div className="flex flex-wrap gap-2">
                    {(savedProfile.health_goals || []).map((goal) => (
                      <span key={goal} className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.08em] bg-emerald-100 text-emerald-700">
                        {labelize(goal)}
                      </span>
                    ))}
                    {!savedProfile.health_goals?.length && (
                      <span className="text-xs font-medium text-[#3e4946]/60">No goals selected yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-12">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => {
                  if (stepNum < step) setStep(stepNum);
                }}>
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${isComplete ? 'bg-[#005144] text-white' :
                      isActive ? 'bg-[#005144] text-white ring-4 ring-[#005144]/15' :
                        'bg-white border-2 border-[#005144]/20 text-[#005144]/40'
                    }`}>
                    {isComplete ? (
                      <span className="material-symbols-outlined text-[14px] md:text-[16px]">check</span>
                    ) : stepNum}
                  </div>
                  <span className={`text-[10px] font-bold transition-colors text-center max-w-[60px] leading-tight ${isActive || isComplete ? 'text-[#005144]' : 'text-[#3e4946]/40'
                    }`}>{label}</span>
                </div>
                {idx < 2 && (
                  <div className={`w-6 sm:w-16 h-[2px] mb-4 transition-colors duration-500 ${step > stepNum ? 'bg-[#005144]' : 'bg-[#005144]/15'
                    }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <div className={isModal ? "" : "bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,81,68,0.08)] overflow-hidden"}>
          <AnimatePresence mode="wait">
            {/* ═══════════════════ STEP 1: Basic Details ═══════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.35 }}
                className="p-5 sm:p-10"
              >
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[#141d1c] mb-1">Basic Information</h2>
                  <p className="text-sm text-[#3e4946]/70">We use this to personalize your health analyses.</p>
                </div>

                <div className="space-y-6">
                  {/* Age & Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#3e4946] ml-1">Age</label>
                      <input
                        type="number"
                        placeholder="e.g. 28"
                        min="1"
                        max="120"
                        className="w-full bg-[#f2fcf9] border-2 border-transparent rounded-xl px-3 sm:px-4 py-3 focus:ring-0 focus:border-[#005144]/30 focus:bg-white transition-all font-semibold text-[#141d1c] placeholder:text-[#3e4946]/30"
                        value={basicInfo.age}
                        onChange={(e) => setBasicInfo({ ...basicInfo, age: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#3e4946] ml-1">Gender</label>
                      <select
                        className="w-full bg-[#f2fcf9] border-2 border-transparent rounded-xl px-3 sm:px-4 py-3 focus:ring-0 focus:border-[#005144]/30 font-semibold text-[#141d1c]"
                        value={basicInfo.gender}
                        onChange={(e) => setBasicInfo({ ...basicInfo, gender: e.target.value })}
                      >
                        <option value="unspecified">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Weight & Height */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#3e4946] ml-1">Weight (kg) <span className="text-[#3e4946]/40 normal-case">optional</span></label>
                      <input
                        type="number"
                        placeholder="e.g. 70"
                        className="w-full bg-[#f2fcf9] border-2 border-transparent rounded-xl px-3 sm:px-4 py-3 focus:ring-0 focus:border-[#005144]/30 focus:bg-white transition-all font-semibold text-[#141d1c] placeholder:text-[#3e4946]/30"
                        value={basicInfo.weight}
                        onChange={(e) => setBasicInfo({ ...basicInfo, weight: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#3e4946] ml-1">Height (cm) <span className="text-[#3e4946]/40 normal-case">optional</span></label>
                      <input
                        type="number"
                        placeholder="e.g. 175"
                        className="w-full bg-[#f2fcf9] border-2 border-transparent rounded-xl px-3 sm:px-4 py-3 focus:ring-0 focus:border-[#005144]/30 focus:bg-white transition-all font-semibold text-[#141d1c] placeholder:text-[#3e4946]/30"
                        value={basicInfo.height}
                        onChange={(e) => setBasicInfo({ ...basicInfo, height: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#3e4946] ml-1">Activity Level <span className="text-[#3e4946]/40 normal-case">optional</span></label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {[
                        { id: 'sedentary', label: 'Sedentary', icon: 'chair', desc: 'Office-based, minimal movement' },
                        { id: 'lightly_active', label: 'Lightly Active', icon: 'directions_walk', desc: '1-3 days/week light exercise' },
                        { id: 'active', label: 'Active', icon: 'directions_run', desc: '4+ sessions/week' },
                        { id: 'very_active', label: 'Very Active', icon: 'fitness_center', desc: 'Daily intense training' }
                      ].map(level => (
                        <button
                          key={level.id}
                          onClick={() => setBasicInfo({ ...basicInfo, activityLevel: level.id })}
                          className={`p-3 sm:p-4 rounded-xl text-left transition-all duration-200 border-2 ${basicInfo.activityLevel === level.id
                              ? 'bg-[#005144]/5 border-[#005144] shadow-sm'
                              : 'bg-[#f2fcf9] border-transparent hover:border-[#005144]/15'
                            }`}
                        >
                          <span className={`material-symbols-outlined text-lg mb-1 ${basicInfo.activityLevel === level.id ? 'text-[#005144]' : 'text-[#3e4946]/50'
                            }`}>{level.icon}</span>
                          <div className="font-bold text-sm text-[#141d1c]">{level.label}</div>
                          <div className="text-[10px] text-[#3e4946]/60 mt-0.5">{level.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Privacy Note */}
                <p className="text-[11px] text-[#3e4946]/50 mt-6 leading-relaxed">
                  We never share or sell this information. It stays in your profile to personalize your analyses.
                </p>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#005144]/5">
                  {!isModal && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="text-[#3e4946]/50 font-semibold text-sm hover:text-[#005144] transition-colors"
                    >
                      Skip for now
                    </button>
                  )}
                  <button
                    disabled={!canProceedStep1}
                    onClick={() => setStep(2)}
                    className="bg-[#005144] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#005144]/20 hover:shadow-[#005144]/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center gap-2"
                  >
                    Continue
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════ STEP 2: Health Conditions ═══════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
                className="p-5 sm:p-10"
              >
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[#141d1c] mb-1">Health Conditions</h2>
                  <p className="text-sm text-[#3e4946]/70">Do you have any of these conditions? Select all that apply.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {conditions.map((condition) => {
                    const isSelected = selectedConditions.includes(condition.id);
                    return (
                      <button
                        key={condition.id}
                        onClick={() => toggleCondition(condition.id)}
                        className={`p-4 rounded-xl text-left transition-all duration-200 border-2 group ${isSelected
                            ? 'bg-[#005144] text-white border-[#005144] shadow-md shadow-[#005144]/15'
                            : 'bg-[#f2fcf9] border-transparent hover:border-[#005144]/15 text-[#141d1c]'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-white/80' : 'text-[#005144]/50'
                            }`}>{isSelected ? 'check_circle' : condition.icon}</span>
                          <span className="font-semibold text-sm">{condition.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#005144]/5">
                  <button
                    onClick={() => setStep(1)}
                    className="text-[#3e4946]/60 font-semibold text-sm hover:text-[#005144] transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back
                  </button>
                  <button
                    disabled={!canProceedStep2}
                    onClick={() => setStep(3)}
                    className="bg-[#005144] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#005144]/20 hover:shadow-[#005144]/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
                  >
                    Continue
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════ STEP 3: Clinical Goals ═══════════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
                className="p-5 sm:p-10"
              >
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[#141d1c] mb-1">Health Goals</h2>
                  <p className="text-sm text-[#3e4946]/70">What are your health goals? Select all that apply.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {goals.map((goal) => {
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`p-4 rounded-xl text-left transition-all duration-200 border-2 group ${isSelected
                            ? 'bg-[#005144] text-white border-[#005144] shadow-md shadow-[#005144]/15'
                            : 'bg-[#f2fcf9] border-transparent hover:border-[#005144]/15 text-[#141d1c]'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-white/80' : 'text-[#005144]/50'
                            }`}>{isSelected ? 'check_circle' : goal.icon}</span>
                          <span className="font-semibold text-sm">{goal.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#005144]/5">
                  <button
                    onClick={() => setStep(2)}
                    className="text-[#3e4946]/60 font-semibold text-sm hover:text-[#005144] transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back
                  </button>
                  <button
                    disabled={!canComplete || saving}
                    onClick={handleComplete}
                    className="bg-[#005144] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#005144]/20 hover:shadow-[#005144]/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-4 mt-8 text-[10px] font-bold text-[#3e4946]/30 uppercase tracking-widest">
          <div className="flex items-center gap-1.5 text-[#005144]/40">
            <span className="material-symbols-outlined text-xs">verified_user</span>
            <span>Encrypted</span>
          </div>
          <span>•</span>
          <span>HIPAA Compliant</span>
          <span>•</span>
          <span>Private & Secure</span>
        </div>
      </main>
    </div>
  );
};

export default ProfileSetup;
