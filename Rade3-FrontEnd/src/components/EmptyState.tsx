import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-full mb-4">
      <Icon className="w-10 h-10 text-gray-500" />
    </div>
    <h3 className="text-xl font-bold text-gray-300 mb-2">{title}</h3>
    <p className="text-gray-400 mb-6">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all"
      >
        {action.label}
      </button>
    )}
  </div>
);
