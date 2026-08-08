import { useState, FormEvent } from 'react';
import { Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch {
      // error state already surfaced via useAuth().error
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-brand-deepNavy flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo/radei-symbol-gold.png" alt="RADEI" className="w-16 h-16 object-contain mb-4" />
          <h1 className="text-2xl font-bold text-white">نظام رادع</h1>
          <p className="text-sm text-brand-steel font-display uppercase tracking-widest mt-1">لوحة التحكم الأمنية</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-brand-navy border border-brand-gold/15 rounded-lg p-6 space-y-4 shadow-gold"
        >
          <h2 className="text-lg font-bold text-white mb-2">تسجيل الدخول</h2>

          <div>
            <label className="text-white/50 text-xs mb-1 block">اسم المستخدم</label>
            <div className="relative">
              <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full bg-brand-navyLight text-white pr-9 pl-3 py-2 rounded-lg border border-brand-graphite focus:border-brand-gold focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs mb-1 block">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-brand-navyLight text-white pr-9 pl-3 py-2 rounded-lg border border-brand-graphite focus:border-brand-gold focus:outline-none text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-950/40 border border-red-600/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-gold hover:bg-brand-goldLight disabled:opacity-60 text-brand-deepNavy font-bold py-2.5 rounded-lg transition-all"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
