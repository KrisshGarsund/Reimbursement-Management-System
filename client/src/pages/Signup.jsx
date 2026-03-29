import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { User, AtSign, Lock, Building2, Globe, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', companyName: '', country: '', currency: '',
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        const data = await res.json();
        const parsed = data
          .map((c) => {
            const currencyCode = c.currencies ? Object.keys(c.currencies)[0] : null;
            return {
              name: c.name.common,
              currency: currencyCode,
              currencyName: currencyCode ? c.currencies[currencyCode]?.name : null,
            };
          })
          .filter((c) => c.currency)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(parsed);
      } catch {
        toast.error('Failed to load countries');
      } finally {
        setLoadingCountries(false);
      }
    }
    fetchCountries();
  }, []);

  const handleCountryChange = (e) => {
    const country = e.target.value;
    const match = countries.find((c) => c.name === country);
    setForm((prev) => ({
      ...prev,
      country,
      currency: match?.currency || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form);
      toast.success('Account created! Welcome to ReimburseIQ');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4 relative font-sans text-brand-main">
      <div className="w-full max-w-lg mt-8 mb-20">
        
        {/* Top Branding Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="px-5 py-2.5 bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-8 flex items-center justify-center">
            <span className="text-xl font-bold tracking-tight text-brand-primary">ReimburseIQ</span>
          </div>
          <h1 className="text-[32px] font-bold text-[#1E254C] mb-2 font-sans tracking-tight">Create your account</h1>
          <p className="text-[#64748B] text-[15px]">Begin your journey with premium expense management.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-10 pt-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Company Name */}
            <div>
              <label className="block text-[11px] font-bold text-brand-label tracking-wider uppercase mb-2">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8695AD]" />
                <input
                  type="text" value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark font-medium placeholder:text-[#A8B6CA] placeholder:font-normal focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary"
                  placeholder="Acme Corporation" required
                />
              </div>
            </div>

            {/* Operational Region */}
            <div>
              <label className="block text-[11px] font-bold text-brand-label tracking-wider uppercase mb-2">Operational Region</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8695AD]" />
                <select
                  value={form.country}
                  onChange={handleCountryChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark font-medium appearance-none placeholder:text-[#A8B6CA] placeholder:font-normal focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary cursor-pointer"
                  required
                  disabled={loadingCountries}
                >
                  <option value="" className="text-[#A8B6CA]">Select your country</option>
                  {countries.map((c) => (
                    <option key={c.name} value={c.name} className="text-brand-dark">{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="#8695AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-[#F1F5F9] my-6"></div>

            {/* Administrator Name */}
            <div>
              <label className="block text-[11px] font-bold text-brand-label tracking-wider uppercase mb-2">Administrator Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8695AD]" />
                <input
                  type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark font-medium placeholder:text-[#A8B6CA] placeholder:font-normal focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Professional Email */}
            <div>
              <label className="block text-[11px] font-bold text-brand-label tracking-wider uppercase mb-2">Professional Email</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8695AD]" />
                <input
                  type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark font-medium placeholder:text-[#A8B6CA] placeholder:font-normal focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary"
                  placeholder="admin@company.com"
                  required
                />
              </div>
            </div>

            {/* Security Key */}
            <div>
              <label className="block text-[11px] font-bold text-brand-label tracking-wider uppercase mb-2">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8695AD]" />
                <input
                  type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark font-medium placeholder:text-[#A8B6CA] placeholder:font-normal focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary tracking-[0.2em]"
                  placeholder="••••••••" required minLength={6}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <input type="checkbox" id="terms" required className="w-[18px] h-[18px] rounded-[4px] border-[#CBD5E1] text-brand-primary focus:ring-brand-primary/20 cursor-pointer accent-brand-primary" />
              <label htmlFor="terms" className="text-[13px] text-[#64748B] font-medium cursor-pointer">
                I agree to the <span className="text-[#334155]">Terms of Service</span> and <span className="text-[#334155]">Privacy Policy</span>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-4 rounded-xl font-semibold hover:bg-brand-primary-hover transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-6 text-[15px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Initialize Dashboard <ArrowRight className="w-[18px] h-[18px] ml-1" /></>
              )}
            </button>
            
            <div className="text-center pt-2">
              <p className="text-[13px] text-[#64748B] font-medium">
                Already managing a company?{' '}
                <Link to="/login" className="text-brand-primary hover:text-brand-primary-hover ml-1">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer / Trusted Logos */}
      <div className="absolute bottom-10 w-full max-w-4xl px-8 flex justify-between items-end">
         <div className="flex items-center text-[12px] text-[#A8B6CA] gap-6 pb-1">
            <Link to="#" className="hover:text-brand-primary transition-colors">Security</Link>
            <Link to="#" className="hover:text-brand-primary transition-colors">Compliance</Link>
            <Link to="#" className="hover:text-brand-primary transition-colors">Support</Link>
         </div>
         
         <div className="flex gap-16">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#F1F5F9] rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-[#8695AD] rounded-md flex items-center justify-center text-white text-[10px] font-bold">1</div>
              </div>
              <div className="w-12 h-12 bg-[#F1F5F9] rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-[#8695AD] rounded-md flex items-center justify-center text-white text-[10px] font-bold">2</div>
              </div>
              <div className="w-12 h-12 bg-[#F1F5F9] rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-[#8695AD] rounded-md flex items-center justify-center text-white text-[10px] font-bold">3</div>
              </div>
            </div>
            
            <div className="text-right flex flex-col justify-end">
              <p className="text-[#8695AD] text-[12px] max-w-[200px] leading-relaxed">
                Trusted by 5,000+ leading enterprises globally for secure financial curation.
              </p>
            </div>
         </div>

         <div className="text-[12px] text-[#A8B6CA] pb-1">
            © 2024 Digital Curator. All rights reserved.
         </div>
      </div>
    </div>
  );
}
