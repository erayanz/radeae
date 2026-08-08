export const StatCardSkeleton = () => (
  <div className="bg-brand-navy border-r-4 border-brand-graphite rounded-lg p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-brand-graphite rounded w-24 mb-3"></div>
        <div className="h-10 bg-brand-graphite rounded w-16"></div>
      </div>
      <div className="w-16 h-16 bg-brand-graphite rounded-lg"></div>
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="bg-brand-navy/50 border-b border-brand-graphite/60">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-brand-graphite rounded w-full animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export const MapSkeleton = () => (
  <div className="bg-brand-navy border border-brand-graphite/60 rounded-lg p-6 h-96 animate-pulse">
    <div className="h-6 bg-brand-graphite rounded w-32 mb-4"></div>
    <div className="bg-brand-deepNavy rounded-lg h-full flex items-center justify-center">
      <div className="text-white/30">جاري تحميل الخريطة...</div>
    </div>
  </div>
);
