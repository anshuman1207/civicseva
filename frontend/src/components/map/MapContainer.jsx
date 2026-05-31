import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, MarkerClustererF } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowUp, Clock, AlertTriangle, Radio, RefreshCw } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { getAssetUrl } from '../../config/constants';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 22.5726,
  lng: 88.3639
};

// ─── Status → Color Mapping ─────────────────────
const STATUS_COLORS = {
  Pending:       { fill: '#EF4444', label: 'Pending',     dotClass: 'bg-red-500' },
  'In Progress': { fill: '#F59E0B', label: 'In Progress', dotClass: 'bg-amber-500' },
  Resolved:      { fill: '#22C55E', label: 'Resolved',    dotClass: 'bg-green-500' },
};

// ─── SVG Marker Generator ───────────────────────
function createMarkerSvg(fillColor, size = 28) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fillColor}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
}

// ─── Google Maps Custom Styles (Clean, minimal) ─
const mapStyles = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#c9e8f7' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#f0f2f5' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e3e8' }] },
];

const MapContainer = ({ selectedLocation, onLocationSelect, readOnly = false, markers = [] }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center gap-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle className="text-red-500" size={40} />
        </div>
        <div className="max-w-xs">
          <h3 className="text-xl font-bold text-white mb-2">Map Interface Unavailable</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            We're having trouble connecting to Google Maps. This could be due to a network issue or an invalid configuration.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white text-slate-950 rounded-xl hover:bg-slate-200 transition-all transform hover:scale-105 active:scale-95 font-bold shadow-xl shadow-white/5 flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Retry Connection
        </button>
      </div>
    );
  }

  const [, setMap] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [liveMarkers, setLiveMarkers] = useState(markers);
  const [newMarkerFlash, setNewMarkerFlash] = useState(false);

  // Sync external markers prop changes into internal state
  useEffect(() => { setLiveMarkers(markers); }, [markers]);

  // Real-time socket updates
  useSocket({
    onNewComplaint: (comp) => {
      const newMarker = {
        id: comp._id,
        lat: comp.location?.coordinates[1] || 22.5726,
        lng: comp.location?.coordinates[0] || 88.3639,
        title: comp.title,
        category: comp.category,
        status: comp.status || 'Pending',
        location: `${comp.city || 'Kolkata'}, ${comp.pincode || ''}`.trim(),
        timeAgo: 'Just now',
        upvotes: comp.upvotes || 0,
        priorityScore: comp.priorityScore || 0,
        imageUrl: getAssetUrl(comp.photo),
      };
      setLiveMarkers(prev => [newMarker, ...prev]);
      setNewMarkerFlash(true);
      setTimeout(() => setNewMarkerFlash(false), 3000);
    },
    onUpvoteUpdate: (data) => {
      setLiveMarkers(prev => prev.map(m =>
        m.id === data.id ? { ...m, upvotes: data.upvotes, priorityScore: data.priorityScore } : m
      ));
      if (activeMarker?.id === data.id) {
        setActiveMarker(prev => prev ? { ...prev, upvotes: data.upvotes, priorityScore: data.priorityScore } : prev);
      }
    },
    onStatusUpdate: (data) => {
      setLiveMarkers(prev => prev.map(m =>
        m.id === data.id ? { ...m, status: data.status } : m
      ));
      if (activeMarker?.id === data.id) {
        setActiveMarker(prev => prev ? { ...prev, status: data.status } : prev);
      }
    },
  });

  const filteredMarkers = useMemo(() => {
    return liveMarkers
      .filter(m => {
        const isValidStatus = filterStatus === 'All' || m.status === filterStatus;
        // Ensure lat/lng exist and are valid numbers
        const lat = parseFloat(m.lat);
        const lng = parseFloat(m.lng);
        const hasCoords = !isNaN(lat) && !isNaN(lng);
        return isValidStatus && hasCoords;
      })
      .map(m => ({
        ...m,
        lat: parseFloat(m.lat),
        lng: parseFloat(m.lng)
      }));
  }, [liveMarkers, filterStatus]);

  // Count markers by status for the filter badges
  const statusCounts = useMemo(() => {
    const counts = { All: liveMarkers.length, Pending: 0, 'In Progress': 0, Resolved: 0 };
    liveMarkers.forEach(m => {
      if (counts[m.status] !== undefined) counts[m.status]++;
    });
    return counts;
  }, [liveMarkers]);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onClick = useCallback((e) => {
    setActiveMarker(null);
    if (!readOnly && onLocationSelect) {
      onLocationSelect({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }, [readOnly, onLocationSelect]);

  const onMarkerDragEnd = useCallback((e) => {
    if (!readOnly && onLocationSelect) {
      onLocationSelect({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }, [readOnly, onLocationSelect]);

  const getMarkerPosition = () => {
    if (!selectedLocation) return null;
    let pos = null;
    if (selectedLocation.lat !== undefined && selectedLocation.lng !== undefined) {
      pos = { lat: parseFloat(selectedLocation.lat), lng: parseFloat(selectedLocation.lng) };
    } else if (Array.isArray(selectedLocation) && selectedLocation.length === 2) {
      pos = { lat: parseFloat(selectedLocation[0]), lng: parseFloat(selectedLocation[1]) };
    }
    
    if (pos && !isNaN(pos.lat) && !isNaN(pos.lng)) {
      return pos;
    }
    return null;
  };

  const markerPosition = getMarkerPosition();

  // ─── Build status-colored marker icons (memoized) ───
  const markerIcons = useMemo(() => {
    if (!isLoaded) return {};
    const icons = {};
    Object.entries(STATUS_COLORS).forEach(([status, { fill }]) => {
      icons[status] = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(createMarkerSvg(fill, 30)),
        scaledSize: new window.google.maps.Size(30, 30),
        anchor: new window.google.maps.Point(15, 30)
      };
    });
    return icons;
  }, [isLoaded]);

  // Draggable pin icon (blue)
  const defaultIcon = useMemo(() => {
    if (!isLoaded) return null;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(createMarkerSvg('#4DA8FF', 36)),
      scaledSize: new window.google.maps.Size(36, 36),
      anchor: new window.google.maps.Point(18, 36)
    };
  }, [isLoaded]);

  // ─── InfoWindow status styling ────────────────
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved':    return { bg: '#E3F5E1', text: '#006622' };
      case 'In Progress': return { bg: '#FFF3E0', text: '#E65100' };
      default:            return { bg: '#FEE2E2', text: '#DC2626' };
    }
  };

  return isLoaded ? (
    <div className="w-full h-full relative z-0 overflow-hidden">

      {/* ─── Live indicator badge ──────────── */}
      <AnimatePresence>
        {newMarkerFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold shadow-lg"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            New issue reported live!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating Status Filter Bar ───────── */}
      {liveMarkers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-xl p-1.5 rounded-2xl shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/30 flex gap-1"
        >
          {['All', 'Pending', 'In Progress', 'Resolved'].map(status => {
            const colorInfo = STATUS_COLORS[status];
            const count = statusCounts[status];
            const isActive = filterStatus === status;

            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? status === 'All'
                      ? 'bg-[var(--color-primary)] text-white shadow-md'
                      : 'text-white shadow-md'
                    : 'bg-transparent text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                }`}
                style={isActive && status !== 'All' ? { backgroundColor: colorInfo?.fill } : {}}
              >
                {colorInfo && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white/80' : colorInfo.dotClass}`}
                  />
                )}
                {status}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* ─── Map Legend (bottom-left) ─────────── */}
      {markers.length > 0 && !readOnly && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-6 left-4 z-10 bg-white/95 backdrop-blur-xl py-2.5 px-3.5 rounded-xl shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/30"
        >
          <p className="text-[10px] font-bold text-[var(--color-on-surface)] uppercase tracking-wider mb-2">Legend</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(STATUS_COLORS).map(([status, { fill, label }]) => (
              <div key={status} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: fill }} />
                <span className="text-[11px] font-medium text-[var(--color-on-surface-variant)]">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Click instruction (when no location selected in report mode) ─── */}
      {!readOnly && !markerPosition && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-semibold">Click on the map to select issue location</span>
        </motion.div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition || center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onClick}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          styles: mapStyles
        }}
      >
        {/* User-placed draggable pin */}
        {markerPosition && (
          <Marker
            position={markerPosition}
            draggable={!readOnly}
            onDragEnd={onMarkerDragEnd}
            icon={defaultIcon}
            animation={window.google.maps.Animation.DROP}
          />
        )}

        {/* Status-colored complaint markers */}
        <MarkerClustererF
          options={{
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
          }}
        >
          {(clusterer) => (
            <>
              {filteredMarkers.map((m) => (
                <Marker
                  key={m.id}
                  position={{ lat: m.lat, lng: m.lng }}
                  icon={markerIcons[m.status] || markerIcons['Pending']}
                  onClick={() => setActiveMarker(m)}
                  title={`${m.title} — ${m.status}`}
                  clusterer={clusterer}
                />
              ))}
            </>
          )}
        </MarkerClustererF>

        {/* ─── Enhanced InfoWindow ────────────── */}
        <AnimatePresence>
          {activeMarker && (
            <InfoWindow
              position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
              onCloseClick={() => setActiveMarker(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -32),
                maxWidth: 280
              }}
            >
              <div className="flex flex-col gap-2 p-1 font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif', minWidth: 220 }}>
                {/* Tags row */}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E0EFFF] text-[#0055CC]">
                    {activeMarker.category || 'Issue'}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: getStatusStyle(activeMarker.status).bg,
                      color: getStatusStyle(activeMarker.status).text
                    }}
                  >
                    {activeMarker.status || 'Pending'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-[#111827] leading-tight">
                  {activeMarker.title}
                </h3>

                {/* Location + time */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-[#4B5563] flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {activeMarker.location}
                  </p>
                  <p className="text-xs text-[#6B7280] flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    {activeMarker.timeAgo}
                  </p>
                </div>

                {/* Upvotes + Priority */}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs font-medium text-[#4B5563]">
                    <ArrowUp className="w-3 h-3" />
                    {activeMarker.upvotes || 0} upvotes
                  </span>
                  {activeMarker.priorityScore > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      Priority: {activeMarker.priorityScore}
                    </span>
                  )}
                </div>

                {/* Photo preview if available */}
                {activeMarker.imageUrl && (
                  <img
                    src={activeMarker.imageUrl}
                    alt={activeMarker.title}
                    className="w-full h-20 object-cover rounded-lg mt-1"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
            </InfoWindow>
          )}
        </AnimatePresence>
      </GoogleMap>
    </div>
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-surface-container-low)] gap-3">
      <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">Loading Map…</span>
    </div>
  );
};

export default React.memo(MapContainer);
