import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Shield, Users, Zap, TrendingUp, 
  Globe, Sparkles, ArrowRight, CheckCircle2,
  BarChart3, Bell, Award
} from 'lucide-react';

/**
 * ShowcaseBanner — Portfolio-ready hero section that displays
 * when demo mode is active on the Dashboard. Replaces
 * the standard welcome block with a premium showcase.
 */
function ShowcaseBanner({ stats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 md:p-10 text-white shadow-2xl shadow-indigo-200/30"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Accent Orbs */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        {/* Left: Branding */}
        <div className="space-y-4 max-w-lg">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10"
            >
              <Globe className="w-6 h-6" />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                Civic<span className="text-blue-200">Seva</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 mt-0.5">
                AI-Powered Civic Intelligence
              </p>
            </div>
          </div>

          <p className="text-sm text-white/70 leading-relaxed max-w-md">
            Empowering citizens and local authorities with real-time issue reporting, 
            smart analytics, and gamified community engagement for smarter urban governance.
          </p>

          {/* Tech Stack Tags */}
          <div className="flex flex-wrap gap-2">
            {['React', 'Node.js', 'MongoDB', 'Socket.io', 'Google Maps', 'Framer Motion'].map(tech => (
              <span key={tech} className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Key Metrics */}
        <div className="grid grid-cols-2 gap-3 min-w-[260px]">
          {[
            { label: 'Issues Tracked', value: stats?.total || '500+', icon: MapPin, accent: 'bg-blue-400/20' },
            { label: 'Resolution Rate', value: stats?.rate ? `${stats.rate}%` : '78%', icon: CheckCircle2, accent: 'bg-green-400/20' },
            { label: 'Active Citizens', value: stats?.users || '200+', icon: Users, accent: 'bg-purple-400/20' },
            { label: 'Real-Time Events', value: 'Live', icon: Zap, accent: 'bg-amber-400/20' },
          ].map((metric) => (
            <motion.div
              key={metric.label}
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 group cursor-default"
            >
              <div className={`w-8 h-8 ${metric.accent} rounded-xl flex items-center justify-center mb-2`}>
                <metric.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-black">{metric.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mt-0.5">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom: Feature Pills */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-white/10">
        {[
          { icon: MapPin, text: 'Geospatial Mapping' },
          { icon: Bell, text: 'Real-Time Alerts' },
          { icon: BarChart3, text: 'Smart Analytics' },
          { icon: Shield, text: 'Authority Dashboard' },
          { icon: Award, text: 'Gamification' },
          { icon: Sparkles, text: 'AI Categorization' },
        ].map((feature) => (
          <span key={feature.text} className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
            <feature.icon className="w-3 h-3 text-blue-300" />
            {feature.text}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default memo(ShowcaseBanner);
