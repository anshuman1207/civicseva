import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Bell, MapPin, Shield, Palette,
  Globe, Smartphone, Eye, Volume2, ChevronRight, Moon, Sun, Info
} from 'lucide-react';

// ─── Toggle Switch ──────────────────────────────
function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-container-high)]'
      }`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md ${
          enabled ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

// ─── Setting Row ────────────────────────────────
function SettingRow({ icon: Icon, label, description, children, iconColor = 'text-[var(--color-primary)]' }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] flex items-center justify-center shrink-0 mt-0.5">
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-on-surface)]">{label}</p>
          {description && (
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Section Card ───────────────────────────────
function SectionCard({ title, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)] overflow-hidden"
    >
      <div className="px-5 pt-5 pb-2">
        <h3 className="text-sm font-bold text-[var(--color-on-surface)] flex items-center gap-2">
          <Icon className="w-4 h-4 text-[var(--color-primary)]" />
          {title}
        </h3>
      </div>
      <div className="px-5 pb-4 divide-y divide-[var(--color-outline-variant)]/15">
        {children}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════
export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailAlerts: false,
    statusUpdates: true,
    nearbyAlerts: true,
    highContrast: false,
    autoLocation: true,
    locationRadius: '5',
    soundEffects: false,
    language: 'English',
  });

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col gap-5 overflow-y-auto pr-2 pb-20 md:pb-10 scrollbar-hide"
    >
      {/* ─── Header ──────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[var(--color-primary)]" />
          Settings
        </h1>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
          Customize your CivicSeva experience
        </p>
      </div>

      {/* ─── Notifications ───────────────── */}
      <SectionCard title="Notifications" icon={Bell} delay={0.05}>
        <SettingRow
          icon={Bell}
          label="Push Notifications"
          description="Get notified about updates on your reported issues"
          iconColor="text-blue-600"
        >
          <Toggle enabled={settings.pushNotifications} onToggle={() => toggle('pushNotifications')} />
        </SettingRow>

        <SettingRow
          icon={Bell}
          label="Email Alerts"
          description="Receive weekly summary emails of civic activity"
          iconColor="text-purple-600"
        >
          <Toggle enabled={settings.emailAlerts} onToggle={() => toggle('emailAlerts')} />
        </SettingRow>

        <SettingRow
          icon={Eye}
          label="Status Updates"
          description="Get notified when your complaint status changes"
          iconColor="text-green-600"
        >
          <Toggle enabled={settings.statusUpdates} onToggle={() => toggle('statusUpdates')} />
        </SettingRow>

        <SettingRow
          icon={MapPin}
          label="Nearby Alerts"
          description="Alerts for new issues reported near your location"
          iconColor="text-amber-600"
        >
          <Toggle enabled={settings.nearbyAlerts} onToggle={() => toggle('nearbyAlerts')} />
        </SettingRow>
      </SectionCard>

      {/* ─── Appearance ──────────────────── */}
      <SectionCard title="Appearance" icon={Palette} delay={0.1}>
        <SettingRow
          icon={isDark ? Moon : Sun}
          label="Dark Mode"
          description="Switch between light and dark theme"
          iconColor={isDark ? 'text-indigo-500' : 'text-amber-500'}
        >
          <Toggle enabled={isDark} onToggle={toggleTheme} />
        </SettingRow>

        <SettingRow
          icon={Eye}
          label="High Contrast"
          description="Increase contrast for better accessibility"
          iconColor="text-gray-600"
        >
          <Toggle enabled={settings.highContrast} onToggle={() => toggle('highContrast')} />
        </SettingRow>

        <SettingRow
          icon={Volume2}
          label="Sound Effects"
          description="Play sounds for notifications and interactions"
          iconColor="text-teal-600"
        >
          <Toggle enabled={settings.soundEffects} onToggle={() => toggle('soundEffects')} />
        </SettingRow>
      </SectionCard>

      {/* ─── Location ────────────────────── */}
      <SectionCard title="Location" icon={MapPin} delay={0.15}>
        <SettingRow
          icon={MapPin}
          label="Auto-detect Location"
          description="Automatically detect your location for nearby issues"
          iconColor="text-red-500"
        >
          <Toggle enabled={settings.autoLocation} onToggle={() => toggle('autoLocation')} />
        </SettingRow>

        <SettingRow
          icon={Globe}
          label="Alert Radius"
          description="Distance for nearby issue notifications"
          iconColor="text-blue-500"
        >
          <select
            value={settings.locationRadius}
            onChange={e => setSettings(prev => ({ ...prev, locationRadius: e.target.value }))}
            className="text-sm font-semibold px-3 py-1.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          >
            <option value="1">1 km</option>
            <option value="2">2 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="25">25 km</option>
          </select>
        </SettingRow>
      </SectionCard>

      {/* ─── Privacy & Security ──────────── */}
      <SectionCard title="Privacy & Security" icon={Shield} delay={0.2}>
        <SettingRow
          icon={Shield}
          label="Anonymous Reporting"
          description="Report issues without showing your identity"
          iconColor="text-violet-600"
        >
          <ChevronRight className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
        </SettingRow>

        <SettingRow
          icon={Smartphone}
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          iconColor="text-green-600"
        >
          <ChevronRight className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
        </SettingRow>
      </SectionCard>

      {/* ─── About ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-[var(--color-surface-container-low)] rounded-[var(--radius-xl)] p-5 border border-[var(--color-outline-variant)]/20 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-sm font-bold text-[var(--color-on-surface)]">CivicSeva</span>
        </div>
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          Version 1.0.0 — Smart City Civic Platform
        </p>
        <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1">
          Built for Kolkata • Community-driven • Open Source
        </p>
      </motion.div>
    </motion.div>
  );
}
