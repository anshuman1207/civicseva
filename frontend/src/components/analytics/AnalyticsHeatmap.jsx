import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';
import { motion } from 'framer-motion';
import { AlertTriangle, Map as MapIcon, Filter, Layers, Activity } from 'lucide-react';
import { api } from '../../utils/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 22.5726,
  lng: 88.3639
};

const mapStyles = [
  { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c9b2a6' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#d3e2f0' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#b9d3c2' }] }
];

// ─── Severity Overlay Gradients ──────────────────
const SEVERITY_GRADIENTS = {
  all: [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 223, 1)',
    'rgba(0, 0, 191, 1)',
    'rgba(0, 0, 159, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)'
  ],
  critical: [
    'rgba(255, 0, 0, 0)',
    'rgba(255, 80, 0, 0.4)',
    'rgba(255, 50, 0, 0.6)',
    'rgba(220, 20, 0, 0.8)',
    'rgba(180, 0, 0, 1)',
    'rgba(139, 0, 0, 1)',
  ],
  moderate: [
    'rgba(255, 165, 0, 0)',
    'rgba(255, 200, 0, 0.4)',
    'rgba(255, 165, 0, 0.6)',
    'rgba(255, 140, 0, 0.8)',
    'rgba(230, 120, 0, 1)',
    'rgba(200, 100, 0, 1)',
  ],
  low: [
    'rgba(0, 200, 100, 0)',
    'rgba(0, 220, 130, 0.3)',
    'rgba(0, 200, 120, 0.5)',
    'rgba(0, 180, 100, 0.7)',
    'rgba(0, 160, 80, 0.9)',
    'rgba(0, 130, 60, 1)',
  ],
};

const SEVERITY_FILTERS = [
  { id: 'all',      label: 'All Issues',       color: 'bg-blue-500',   textColor: 'text-blue-500' },
  { id: 'critical',  label: 'Critical',         color: 'bg-red-500',    textColor: 'text-red-500' },
  { id: 'moderate', label: 'Moderate',          color: 'bg-amber-500',  textColor: 'text-amber-500' },
  { id: 'low',      label: 'Low Severity',      color: 'bg-green-500',  textColor: 'text-green-500' },
];

export default function AnalyticsHeatmap() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['visualization']
  });

  const [heatmapData, setHeatmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const data = await api.get('/analytics/heatmap');
        setHeatmapData(data);
      } catch (err) {
        console.error("Failed to fetch heatmap data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  // Filter data by severity level based on intensity
  const filteredData = useMemo(() => {
    if (severityFilter === 'all') return heatmapData;
    return heatmapData.filter(p => {
      const intensity = p.intensity || 0;
      switch (severityFilter) {
        case 'critical': return intensity >= 0.7;
        case 'moderate': return intensity >= 0.3 && intensity < 0.7;
        case 'low':      return intensity < 0.3;
        default:         return true;
      }
    });
  }, [heatmapData, severityFilter]);

  const points = useMemo(() => {
    if (!isLoaded || filteredData.length === 0) return [];
    return filteredData.map(p => ({
      location: new window.google.maps.LatLng(p.lat, p.lng),
      weight: p.intensity || 1
    }));
  }, [isLoaded, filteredData]);

  // Heatmap config based on severity filter
  const heatmapOptions = useMemo(() => ({
    radius: severityFilter === 'critical' ? 50 : severityFilter === 'low' ? 30 : 40,
    opacity: severityFilter === 'critical' ? 0.85 : 0.7,
    gradient: SEVERITY_GRADIENTS[severityFilter],
  }), [severityFilter]);

  if (loadError) return (
    <div className="h-full flex items-center justify-center bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100">
      <AlertTriangle className="w-5 h-5 mr-2" /> Map Error — Check API Key
    </div>
  );
  if (!isLoaded || isLoading) return <div className="h-full animate-pulse bg-[var(--color-surface-container-low)] rounded-2xl" />;

  return (
    <div className="w-full h-full relative rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-outline-variant)]/20 shadow-inner">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          disableDefaultUI: true,
          styles: mapStyles,
        }}
      >
        {points.length > 0 && (
          <HeatmapLayer
            data={points}
            options={heatmapOptions}
          />
        )}
      </GoogleMap>

      {/* ─── Severity Filter Overlay ──────────────── */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl border border-white/50 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Severity Overlay</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {SEVERITY_FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSeverityFilter(filter.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  severityFilter === filter.id
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${filter.color} ${severityFilter === filter.id ? 'ring-2 ring-white' : ''}`} />
                {filter.label}
                {severityFilter === filter.id && (
                  <span className="ml-auto text-[8px] bg-white/20 px-1.5 py-0.5 rounded-md font-black">
                    {filteredData.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Live Density Info ────────────────────── */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-xl pointer-events-none">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Live Issue Density
        </h4>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex-1 h-1 w-24 bg-gradient-to-r from-cyan-400 via-blue-500 to-red-500 rounded-full" />
          <span className="text-[8px] font-black text-slate-500 uppercase">High Severity</span>
        </div>
      </div>

      {/* ─── Bottom Stats Bar ────────────────────── */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/90 text-[10px] font-bold flex items-center gap-2 shadow-2xl">
          <MapIcon className="w-3 h-3 text-cyan-400" />
          {filteredData.length} Hotspots Tracked
        </div>
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/90 text-[10px] font-bold flex items-center gap-2 shadow-2xl">
          <Activity className="w-3 h-3 text-emerald-400" />
          Filter: {SEVERITY_FILTERS.find(f => f.id === severityFilter)?.label}
        </div>
      </div>
    </div>
  );
}
