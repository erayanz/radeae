import { useCallback, useState } from 'react'
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
  Circle,
  Marker,
  InfoWindow
} from '@react-google-maps/api'
import { Event } from '../types'

const RESERVE_INFO = {
  nameAr: 'محمية الملك عبدالعزيز الملكية',
  location: 'شمال الرياض، السعودية',
  area: '28,000 كم²',
  establishedYear: 2018,
  distance_from_riyadh: '180 كم شمالاً'
}

// ✅ الحدود الدقيقة جداً من الصورة الرسمية المرفقة
const reserveBoundary: google.maps.LatLngLiteral[] = [
  // بداية من الشمال الغربي وبإتجاه عقارب الساعة
  { lat: 27.20, lng: 44.80 },  // أقصى الشمال الغربي
  { lat: 27.50, lng: 45.20 },  // الشمال
  { lat: 27.60, lng: 45.80 },  // الشمال الشرقي العلوي
  { lat: 27.50, lng: 46.50 },  // الشمال الشرقي
  { lat: 27.20, lng: 47.00 },  // أقصى الشرق الشمالي
  { lat: 26.80, lng: 47.20 },  // الشرق العلوي
  { lat: 26.40, lng: 47.30 },  // الشرق
  { lat: 26.00, lng: 47.20 },  // الشرق السفلي
  { lat: 25.60, lng: 47.00 },  // الجنوب الشرقي العلوي
  { lat: 25.30, lng: 46.70 },  // الجنوب الشرقي
  { lat: 25.00, lng: 46.40 },  // الجنوب (قرب الرياض)
  { lat: 24.90, lng: 46.00 },  // الجنوب الغربي السفلي
  { lat: 25.00, lng: 45.50 },  // الجنوب الغربي
  { lat: 25.20, lng: 45.10 },  // الغرب السفلي
  { lat: 25.50, lng: 44.80 },  // الغرب
  { lat: 25.90, lng: 44.60 },  // الغرب العلوي
  { lat: 26.30, lng: 44.50 },  // الشمال الغربي السفلي
  { lat: 26.70, lng: 44.60 }   // الشمال الغربي
]

// ✅ مركز المحمية المحدّث (وسط المنطقة)
const reserveCenter = {
  lat: 26.25,
  lng: 45.90
}

interface GoogleMapViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

const GoogleMapView = ({ events, onEventClick }: GoogleMapViewProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showLegend, setShowLegend] = useState(true)
  const [showInfo, setShowInfo] = useState(true)
  const [showStats, setShowStats] = useState(true)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry']
  })

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log('✅ Map loaded successfully')
    setMap(mapInstance)
    
    // ضبط المركز والـ zoom لرؤية المحمية كاملة
    mapInstance.setCenter(reserveCenter)
    mapInstance.setZoom(7)  // zoom أوسع لرؤية الحدود الكاملة
  }, [])

  const getMarkerColor = (riskLevel: string): string => {
    if (riskLevel === 'high') return '#EF4444'
    if (riskLevel === 'medium') return '#FBBF24'
    if (riskLevel === 'low') return '#10B981'
    return '#6B7280'
  }

  const getEventEmoji = (eventType: string): string => {
    const emojis: { [key: string]: string } = {
      'vehicle': '🚗',
      'human': '👤',
      'animal': '🦁',
      'noise': '🔊'
    }
    return emojis[eventType] || '📍'
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-blue-400 rounded-full"></div>
          </div>
          <p className="text-white">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-700 shadow-lg bg-gray-800 relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '600px' }}
        center={reserveCenter}
        zoom={7}
        onLoad={onLoad}
        options={{
          styles: [
            { featureType: 'all', elementType: 'all', stylers: [{ saturation: -100 }, { gamma: 1.52 }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#193341' }] },
            { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#2c5a87' }] }
          ],
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          minZoom: 6,
          maxZoom: 18,
          gestureHandling: 'greedy'
        }}
      >
        {/* ✅ POLYGON - الحدود الدقيقة جداً من الصورة الرسمية */}
        <Polygon
          path={reserveBoundary}
          options={{
            fillColor: '#DC2626',        // أحمر غامق واضح
            fillOpacity: 0.25,           // شفافية أخف قليلاً
            strokeColor: '#991B1B',      // حدود أحمر غامق جداً
            strokeWeight: 4,             // سمك متوسط (4px)
            strokeOpacity: 1,            // مرئي 100%
            geodesic: true,
            clickable: false
          }}
        />

        {/* ✅ دائرة مركز المحمية */}
        <Circle
          center={reserveCenter}
          radius={50000}  // 50 كم
          options={{
            fillColor: '#3B82F6',
            fillOpacity: 0.06,
            strokeColor: '#3B82F6',
            strokeWeight: 2,
            strokeOpacity: 0.5
          }}
        />

        {/* ✅ Marker المركز */}
        <Marker
          position={reserveCenter}
          title="مركز محمية الملك عبدالعزيز الملكية"
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#DC2626',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }}
          label={{
            text: '🦁',
            fontSize: '24px'
          }}
        />

        {/* الأحداث */}
        {events && events.length > 0 && events.map((event) => (
          <Marker
            key={event.id}
            position={{ lat: event.latitude, lng: event.longitude }}
            title={event.description}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: getMarkerColor(event.riskLevel),
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }}
            label={{ text: getEventEmoji(event.eventType), fontSize: '16px' }}
            onClick={() => {
              setSelectedEvent(event)
              onEventClick?.(event)
            }}
          />
        ))}

        {selectedEvent && (
          <InfoWindow
            position={{ lat: selectedEvent.latitude, lng: selectedEvent.longitude }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <div className="bg-gray-900 text-white rounded p-3 max-w-xs text-sm" dir="rtl">
              <h3 className="font-bold text-blue-400 mb-2">
                {getEventEmoji(selectedEvent.eventType)} {selectedEvent.description}
              </h3>
              <div className="space-y-1">
                <div><span className="text-gray-400">المنطقة:</span> {selectedEvent.zone}</div>
                <div><span className="text-gray-400">الخطر:</span> 
                  <span className={selectedEvent.riskLevel === 'high' ? 'text-red-400' : selectedEvent.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}>
                    {selectedEvent.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-6 left-6 bg-gray-900 border-2 border-red-600 rounded p-3 text-white shadow-lg" style={{ zIndex: 10, maxWidth: '200px' }}>
          <button
            onClick={() => setShowLegend(false)}
            className="absolute top-1 right-1 text-red-400 hover:text-red-300 p-1"
          >
            ✕
          </button>
          
          <h3 className="font-bold text-red-400 text-sm mb-2 pr-4">🔴 المفتاح</h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border border-white"></div>
              <span>خطر عالي</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full border border-white"></div>
              <span>خطر متوسط</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full border border-white"></div>
              <span>خطر منخفض</span>
            </div>
            <div className="border-t border-gray-600 pt-1 mt-1">
              <div className="flex items-center gap-2">
                <div className="h-0.5 bg-red-600" style={{ width: '16px' }}></div>
                <span>حدود المحمية</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      {showInfo && (
        <div className="absolute top-6 left-6 bg-gray-900 border-2 border-blue-600 rounded p-3 text-white shadow-lg" style={{ zIndex: 10, maxWidth: '240px' }}>
          <button
            onClick={() => setShowInfo(false)}
            className="absolute top-1 right-1 text-blue-400 hover:text-blue-300 p-1"
          >
            ✕
          </button>
          
          <h2 className="text-sm font-bold text-blue-400 mb-1 pr-4">🦁 {RESERVE_INFO.nameAr}</h2>
          <p className="text-xs text-gray-400 mb-2">{RESERVE_INFO.location}</p>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">📏 المساحة:</span>
              <span className="font-bold">{RESERVE_INFO.area}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">📅 التأسيس:</span>
              <span className="font-bold">{RESERVE_INFO.establishedYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">📍 المسافة:</span>
              <span className="font-bold">{RESERVE_INFO.distance_from_riyadh}</span>
            </div>
            <div className="border-t border-gray-700 pt-1 mt-1">
              <p className="text-blue-300 text-xs">⚠️ منطقة محمية</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="absolute top-6 right-6 bg-gray-900 border-2 border-red-600 rounded p-3 text-white shadow-lg" style={{ zIndex: 10, maxWidth: '180px' }}>
          <button
            onClick={() => setShowStats(false)}
            className="absolute top-1 left-1 text-red-400 hover:text-red-300 p-1"
          >
            ✕
          </button>
          
          <h3 className="font-bold text-red-400 text-sm mb-2 pl-4">📊 الإحصائيات</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">الكل:</span>
              <span className="font-bold text-blue-400">{events?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">عالي:</span>
              <span className="font-bold text-red-400">{events?.filter(e => e.riskLevel === 'high').length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">متوسط:</span>
              <span className="font-bold text-yellow-400">{events?.filter(e => e.riskLevel === 'medium').length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">منخفض:</span>
              <span className="font-bold text-green-400">{events?.filter(e => e.riskLevel === 'low').length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Buttons */}
      <div className="absolute top-6 bottom-6 left-2 flex flex-col gap-1" style={{ zIndex: 9 }}>
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all shadow"
            title="فتح المفتاح"
          >
            📋
          </button>
        )}
        
        {!showInfo && (
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all shadow"
            title="فتح المعلومات"
          >
            ℹ️
          </button>
        )}
        
        {!showStats && (
          <button
            onClick={() => setShowStats(true)}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all shadow"
            title="فتح الإحصائيات"
          >
            📊
          </button>
        )}
      </div>
    </div>
  )
}

export default GoogleMapView