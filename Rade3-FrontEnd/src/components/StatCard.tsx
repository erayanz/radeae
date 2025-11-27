import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  color: 'danger' | 'warning' | 'success' | 'info';
  icon: LucideIcon;
}

const StatCard = ({ label, value, color, icon: Icon }: StatCardProps) => {
  const [count, setCount] = useState(0);

  const colorClasses = {
    danger: 'border-red-500 text-red-400 bg-red-500/10',
    warning: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
    success: 'border-green-500 text-green-400 bg-green-500/10',
    info: 'border-blue-500 text-blue-400 bg-blue-500/10'
  };

  // ✅ تحديث العداد فوراً عند تغيير value
  useEffect(() => {
    setCount(value);
  }, [value]);

  return (
    <div className={`bg-gray-800 border-r-4 ${colorClasses[color].split(' ')[0]} rounded-lg p-6 transition-all hover:shadow-lg hover:scale-105 cursor-pointer`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          <p className={`text-4xl font-bold ${colorClasses[color].split(' ')[1]} transition-all duration-300`}>
            {count}
          </p>
        </div>
        <div className={`${colorClasses[color]} p-4 rounded-lg`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
