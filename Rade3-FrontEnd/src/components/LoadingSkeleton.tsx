export const StatCardSkeleton = () => (
  <div className="bg-gray-800 border-r-4 border-gray-700 rounded-lg p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-700 rounded w-24 mb-3"></div>
        <div className="h-10 bg-gray-700 rounded w-16"></div>
      </div>
      <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="bg-gray-800/50 border-b border-gray-700">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export const MapSkeleton = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-96 animate-pulse">
    <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
    <div className="bg-gray-900 rounded-lg h-full flex items-center justify-center">
      <div className="text-gray-600">جاري تحميل الخريطة...</div>
    </div>
  </div>
);
