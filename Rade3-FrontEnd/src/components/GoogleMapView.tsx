import { useCallback, useState, useEffect } from 'react'
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
  Circle,
  Marker,
  MarkerClusterer,
  InfoWindow
} from '@react-google-maps/api'
import { Event, Site } from '../types'

interface GoogleMapViewProps {
  events: Event[];
  site: Site;
  onEventClick?: (event: Event) => void;
}

const GoogleMapView = ({ events, site, onEventClick }: GoogleMapViewProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const center = { lat: site.centerLatitude, lng: site.centerLongitude }
  const boundary = site.boundaryPolygon ? (JSON.parse(site.boundaryPolygon) as google.maps.LatLngLiteral[]) : null

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry']
  })

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log('✅ Map loaded successfully')
    setMap(mapInstance)
  }, [])

  // Fits the view to whatever this site actually contains (boundary polygon
  // + events), instead of a fixed zoom=7 that only made sense for the
  // reserve's ~250km span. A small site (e.g. a ~550m geophone line) would
  // render as an invisible dot at zoom 7 -- fitBounds adapts per site.
  useEffect(() => {
    if (!map) return
    const bounds = new google.maps.LatLngBounds()
    bounds.extend(center)
    boundary?.forEach(point => bounds.extend(point))
    events.forEach(e => bounds.extend({ lat: e.latitude, lng: e.longitude }))
    map.fitBounds(bounds, 60)
    // A single-point site (no boundary, no events) would fit to a
    // meaningless zoom-max; keep a sane default in that case.
    if (!boundary && events.length === 0) {
      map.setCenter(center)
      map.setZoom(7)
    }
  }, [map, site.id, center.lat, center.lng, boundary, events])

  const getMarkerColor = (riskLevel: string): string => {
    if (riskLevel === 'high') return '#EF4444'
    if (riskLevel === 'medium') return '#FBBF24'
    if (riskLevel === 'low') return '#10B981'
    return '#6B7280'
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-brand-navy rounded-lg border border-brand-graphite/60">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-brand-graphite border-t-brand-gold rounded-full"></div>
          </div>
          <p className="text-white">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-brand-gold/15 shadow-lg bg-brand-navy relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '600px' }}
        center={center}
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
        {/* ✅ POLYGON - حدود الموقع */}
        {boundary && (
          <Polygon
            path={boundary}
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
        )}

        {/* ✅ دائرة مركز الموقع */}
        {site.protectionRadiusMeters != null && (
          <Circle
            center={center}
            radius={site.protectionRadiusMeters}
            options={{
              fillColor: '#3B82F6',
              fillOpacity: 0.06,
              strokeColor: '#3B82F6',
              strokeWeight: 2,
              strokeOpacity: 0.5
            }}
          />
        )}

        {/* ✅ Marker المركز */}
        <Marker
          position={center}
          title={`مركز ${site.nameAr}`}
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

        {/* الأحداث — مجمّعة (clustered) لأن بعض المواقع (مثل وادي الأصفر)
            تحتوي آلاف الأحداث التاريخية، وعرضها كنقاط منفردة بدون تجميع
            يصبح غير قابل للقراءة وبطيئاً */}
        {events && events.length > 0 && (
          <MarkerClusterer>
            {(clusterer) => (
              <>
                {events.map((event) => (
                  <Marker
                    key={event.id}
                    position={{ lat: event.latitude, lng: event.longitude }}
                    title={event.description}
                    clusterer={clusterer}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: getMarkerColor(event.riskLevel),
                      fillOpacity: 0.9,
                      strokeColor: '#ffffff',
                      strokeWeight: 2
                    }}
                    onClick={() => {
                      setSelectedEvent(event)
                      onEventClick?.(event)
                    }}
                  />
                ))}
              </>
            )}
          </MarkerClusterer>
        )}

        {selectedEvent && (
          <InfoWindow
            position={{ lat: selectedEvent.latitude, lng: selectedEvent.longitude }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <div className="bg-brand-deepNavy text-white rounded p-3 max-w-xs text-sm" dir="rtl">
              <h3 className="font-bold text-brand-goldLight mb-2">
                {selectedEvent.description}
              </h3>
              <div className="space-y-1">
                <div><span className="text-white/50">المنطقة:</span> {selectedEvent.zone}</div>
                <div><span className="text-white/50">الخطر:</span>
                  <span className={selectedEvent.riskLevel === 'high' ? 'text-red-400' : selectedEvent.riskLevel === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}>
                    {selectedEvent.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

export default GoogleMapView