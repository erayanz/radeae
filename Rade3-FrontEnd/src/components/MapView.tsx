import { useState } from 'react';
import { mockEvents } from '../data/mockData';
import { Event } from '../types';

const MapView = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'human': return '👤';
      case 'vehicle': return '🚗';
      case 'animal': return '🦁';
      case 'noise': return '🔊';
      default: return '⚠️';
    }
  };

  // تحويل الإحداثيات الحقيقية إلى إحداثيات SVG
  const toSVGCoords = (lat: number, lng: number) => {
    const minLat = 24.710, maxLat = 24.730;
    const minLng = 46.665, maxLng = 46.690;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 800;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 600;
    
    return { x, y };
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
      <h3 className="text-lg lg:text-xl font-bold mb-4 text-white">خريطة المحمية</h3>
      
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <svg viewBox="0 0 800 600" className="w-full h-auto">
          {/* خلفية المحمية */}
          <rect x="0" y="0" width="800" height="600" fill="#1F2937" />
          
          {/* حدود المحمية */}
          <path
            d="M 100 100 L 700 100 L 700 500 L 100 500 Z"
            fill="none"
            stroke="#DC2626"
            strokeWidth="3"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          
          {/* شبكة */}
          {[...Array(8)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={100 + i * 75}
              y1="100"
              x2={100 + i * 75}
              y2="500"
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="100"
              y1={100 + i * 80}
              x2="700"
              y2={100 + i * 80}
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* نقاط الأحداث */}
          {mockEvents.map((event) => {
            const { x, y } = toSVGCoords(event.latitude, event.longitude);
            const color = getRiskColor(event.riskLevel);
            
            return (
              <g
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  opacity="0.8"
                  className="animate-pulse"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.4"
                />
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fontSize="12"
                  fill="white"
                >
                  {getEventIcon(event.eventType)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* تفاصيل الحدث المختار */}
        {selectedEvent && (
          <div className="absolute top-2 lg:top-4 left-2 lg:left-4 bg-gray-800 border border-gray-600 rounded-lg p-3 lg:p-4 max-w-[90%] lg:max-w-sm shadow-xl">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-base lg:text-lg font-bold text-white">
                {getEventIcon(selectedEvent.eventType)} {selectedEvent.zone}
              </h4>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs lg:text-sm">
              <p className="text-gray-300">{selectedEvent.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">مستوى الخطر:</span>
                <span
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{ backgroundColor: getRiskColor(selectedEvent.riskLevel), color: 'white' }}
                >
                  {selectedEvent.riskLevel === 'high' ? 'عالي' : selectedEvent.riskLevel === 'medium' ? 'متوسط' : 'منخفض'}
                </span>
              </div>
              <p className="text-gray-400 text-xs">{selectedEvent.timestamp}</p>
              <p className="text-blue-400 mt-2">
                <strong>الإجراء المقترح:</strong> {selectedEvent.suggestedAction}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* مفتاح الخريطة */}
      <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 mt-4 text-xs lg:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-400">عالي الخطورة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-400">متوسط الخطورة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-400">منخفض الخطورة</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
