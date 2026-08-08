import { Home, ArrowRight } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-9xl font-bold font-tactical text-brand-graphite mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-4">الصفحة غير موجودة</h1>
        <p className="text-white/50 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة</p>
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-goldLight text-brand-deepNavy font-semibold px-6 py-3 rounded-lg transition-all"
        >
          <Home className="w-5 h-5" />
          العودة للرئيسية
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotFound;
