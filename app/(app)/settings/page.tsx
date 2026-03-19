'use client';

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface PrefsForm {
  notifyHighSeverity: boolean;
  notifyActionsDue: boolean;
  notifyWeeklySummary: boolean;
  notifyDataFreshness: boolean;
  defaultBrand: string;
  defaultTimeWindow: string;
  defaultGeography: string;
}

const DEFAULT_PREFS: PrefsForm = {
  notifyHighSeverity: true,
  notifyActionsDue: true,
  notifyWeeklySummary: false,
  notifyDataFreshness: true,
  defaultBrand: 'ONC-101',
  defaultTimeWindow: 'Last 7 days',
  defaultGeography: 'Nation',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileForm>({ firstName: '', lastName: '', email: '', role: '' });
  const [prefs, setPrefs] = useState<PrefsForm>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/settings/preferences').then((r) => r.json()),
    ]).then(([user, p]: [UserProfile, PrefsForm]) => {
      const [firstName = '', ...rest] = (user.name ?? '').split(' ');
      setProfile({ firstName, lastName: rest.join(' '), email: user.email, role: user.role });
      setPrefs({
        notifyHighSeverity: p.notifyHighSeverity ?? true,
        notifyActionsDue: p.notifyActionsDue ?? true,
        notifyWeeklySummary: p.notifyWeeklySummary ?? false,
        notifyDataFreshness: p.notifyDataFreshness ?? true,
        defaultBrand: p.defaultBrand ?? 'ONC-101',
        defaultTimeWindow: p.defaultTimeWindow ?? 'Last 7 days',
        defaultGeography: p.defaultGeography ?? 'Nation',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleNotifyToggle(field: keyof Pick<PrefsForm, 'notifyHighSeverity' | 'notifyActionsDue' | 'notifyWeeklySummary' | 'notifyDataFreshness'>, value: boolean) {
    const previous = prefs;
    const updated = { ...prefs, [field]: value };
    setPrefs(updated);
    try {
      const res = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      toast.success('Notification preference saved');
    } catch {
      setPrefs(previous); // revert
      toast.error('Failed to save preference');
    }
  }

  async function handleSavePrefs() {
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultBrand: prefs.defaultBrand,
          defaultTimeWindow: prefs.defaultTimeWindow,
          defaultGeography: prefs.defaultGeography,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${profile.firstName} ${profile.lastName}`.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Settings</h1>
        <p className="text-[#64748B] mb-8">Manage your account preferences and configuration</p>

        <div className="space-y-6">

          {/* User Profile */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                <User className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1E293B]">User Profile</h2>
                <p className="text-sm text-[#64748B]">Update your personal information</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm text-[#334155] mb-2 block">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    disabled={loading}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm text-[#334155] mb-2 block">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    disabled={loading}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-sm text-[#334155] mb-2 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-[#F8FAFC] rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-sm text-[#334155] mb-2 block">Role</Label>
                <Input
                  id="role"
                  value={profile.role}
                  disabled
                  className="bg-[#F8FAFC] rounded-xl"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={loading || savingProfile}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl"
              >
                {savingProfile ? 'Saving\u2026' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1E293B]">Notifications</h2>
                <p className="text-sm text-[#64748B]">Configure your alert preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              {([
                { field: 'notifyHighSeverity' as const, label: 'High-severity insights', desc: 'Get notified when critical insights are generated' },
                { field: 'notifyActionsDue' as const, label: 'Action items due soon', desc: 'Reminders for upcoming action item deadlines' },
                { field: 'notifyWeeklySummary' as const, label: 'Weekly summary', desc: 'Weekly digest of key metrics and insights' },
                { field: 'notifyDataFreshness' as const, label: 'Data freshness alerts', desc: 'Alerts when data sources become stale' },
              ] as const).map(({ field, label, desc }) => (
                <div key={field} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">{label}</p>
                    <p className="text-xs text-[#64748B]">{desc}</p>
                  </div>
                  <Switch
                    checked={prefs[field]}
                    onCheckedChange={(v) => handleNotifyToggle(field, v)}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Data Preferences */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                <Database className="w-5 h-5 text-[#F97316]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1E293B]">Data Preferences</h2>
                <p className="text-sm text-[#64748B]">Set your default data view settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="defaultBrand" className="text-sm text-[#334155] mb-2 block">Default Brand</Label>
                <Input
                  id="defaultBrand"
                  value={prefs.defaultBrand}
                  onChange={(e) => setPrefs({ ...prefs, defaultBrand: e.target.value })}
                  disabled={loading}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="defaultTimeWindow" className="text-sm text-[#334155] mb-2 block">Default Time Window</Label>
                <Input
                  id="defaultTimeWindow"
                  value={prefs.defaultTimeWindow}
                  onChange={(e) => setPrefs({ ...prefs, defaultTimeWindow: e.target.value })}
                  disabled={loading}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="defaultGeography" className="text-sm text-[#334155] mb-2 block">Default Geography</Label>
                <Input
                  id="defaultGeography"
                  value={prefs.defaultGeography}
                  onChange={(e) => setPrefs({ ...prefs, defaultGeography: e.target.value })}
                  disabled={loading}
                  className="rounded-xl"
                />
              </div>
              <Button
                onClick={handleSavePrefs}
                disabled={loading || savingPrefs}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl"
              >
                {savingPrefs ? 'Saving\u2026' : 'Save Preferences'}
              </Button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#FDF4FF] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#A855F7]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1E293B]">Security</h2>
                <p className="text-sm text-[#64748B]">Manage your security settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Two-factor authentication</p>
                  <p className="text-xs text-[#64748B]">Add an extra layer of security to your account</p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Session timeout</p>
                  <p className="text-xs text-[#64748B]">Automatically log out after 8 hours of inactivity</p>
                </div>
                <Switch checked disabled />
              </div>
              <Button variant="outline" disabled className="rounded-xl">
                Change Password
              </Button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
