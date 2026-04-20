import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MapContainer from '../components/map/MapContainer';
import { useApi } from '../hooks/useApi';
import { MapPin, RefreshCw, Layers, Info, AlertTriangle } from 'lucide-react';
import { DashboardSkeleton as PageSkeleton } from '../components/common/Skeleton';
import ComponentErrorBoundary from '../components/common/ComponentErrorBoundary';

const MapPage = ({ selectedLocation, onLocationSelect }) => {
  const [markers, setMarkers] = useState([]);
  const { loading, error, get } = useApi();


  const fetchComplaints = async () => {
    try {
      const data = await get('/complaints?limit=100');
      const complaints = Array.isArray(data) ? data : data.complaints || [];
      
      const formatted = complaints.map(comp => ({
        id: comp._id,
        lat: Number(comp.location?.coordinates?.[1]) || 22.5726,
        lng: Number(comp.location?.coordinates?.[0]) || 88.3639,
        title: comp.title,
        category: comp.category,
        status: comp.status || 'Pending',
        location: comp.address || 'Kolkata',
        timeAgo: 'Recently',
        upvotes: comp.upvotes || 0,
        priorityScore: comp.priorityScore || 0,
        imageUrl: comp.photo ? comp.photo : null,
      }));
      
      setMarkers(formatted);
    } catch (err) {
      console.error("Failed to fetch map markers:", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [get]);

  const handleLocationSelect = (latlng) => {
    if (onLocationSelect) onLocationSelect(latlng);
  };


  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-hidden">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-surface-container-lowest)] p-4 rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/30 shadow-[var(--shadow-soft-1)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
            Live Issue Map
          </h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Explore and track reported civic issues across the city.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchComplaints}
            disabled={loading}
            className="p-2 rounded-xl bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)] transition-all"
            title="Refresh Map"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="h-8 w-[1px] bg-[var(--color-outline-variant)]/50 mx-1 hidden sm:block" />
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-lg text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            {markers.length} Issues Active
          </div>
        </div>
      </div>

      {/* Main Map Content */}
      <div className="flex-1 min-h-0 relative rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)]">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-surface-container-lowest)] p-8 text-center gap-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Unable to Load Map Data</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{error}</p>
            </div>
            <button 
              onClick={fetchComplaints}
              className="mt-4 px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary)]/90 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : (
          <ComponentErrorBoundary name="Interactive Map">
            <MapContainer 
              markers={markers}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
            />
          </ComponentErrorBoundary>
        )}

        {/* Floating Instruction overlay */}
        {!selectedLocation && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-6 right-6 z-10 max-w-[200px] bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-100 hidden md:block"
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-600 leading-normal">
                Click on markers to view details, or click on the map to start a new report.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
