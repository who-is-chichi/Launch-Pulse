'use client';

import React from 'react';
import { User, Bell, Shield, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-[#0F172A] mb-1">Settings</h1>
        <p className="text-sm text-[#64748B]">Manage your account and application preferences</p>
      </motion.div>

      <div className="space-y-6">
        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
              <User className="w-4 h-4 text-[#1D4ED8]" />
            </div>
            <h2 className="text-base font-semibold text-[#0F172A]">User Profile</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm text-[#334155] mb-2 block">First Name</Label>
                <Input id="firstName" defaultValue="Alex" className="rounded-xl" />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm text-[#334155] mb-2 block">Last Name</Label>
                <Input id="lastName" defaultValue="Thompson" className="rounded-xl" />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm text-[#334155] mb-2 block">Email</Label>
              <Input id="email" type="email" defaultValue="alex.thompson@company.com" className="rounded-xl" />
            </div>

            <div>
              <Label htmlFor="role" className="text-sm text-[#334155] mb-2 block">Role</Label>
              <Input id="role" defaultValue="Analytics Manager" disabled className="bg-[#F8FAFC] rounded-xl" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#F1F5F9]">
            <Button>Save Changes</Button>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#D97706]" />
            </div>
            <h2 className="text-base font-semibold text-[#0F172A]">Notifications</h2>
          </div>

          <div className="space-y-1">
            {[
              { title: 'High-severity insights', desc: 'Get notified when high-severity insights are generated', checked: true },
              { title: 'Action items due soon', desc: 'Receive reminders for upcoming action item deadlines', checked: true },
              { title: 'Weekly summary', desc: 'Get a weekly email with key metrics and insights', checked: false },
              { title: 'Data freshness alerts', desc: 'Alert when data sources become stale', checked: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3.5 px-3 -mx-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                <div>
                  <div className="text-sm font-medium text-[#0F172A]">{item.title}</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">{item.desc}</div>
                </div>
                <Switch defaultChecked={item.checked} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Data Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
              <Database className="w-4 h-4 text-[#16A34A]" />
            </div>
            <h2 className="text-base font-semibold text-[#0F172A]">Data Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="defaultBrand" className="text-sm text-[#334155] mb-2 block">Default Brand</Label>
              <Input id="defaultBrand" defaultValue="ONC-101" className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="defaultTimeWindow" className="text-sm text-[#334155] mb-2 block">Default Time Window</Label>
              <Input id="defaultTimeWindow" defaultValue="Last 7 days" className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="defaultGeography" className="text-sm text-[#334155] mb-2 block">Default Geography</Label>
              <Input id="defaultGeography" defaultValue="Nation" className="rounded-xl" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#F1F5F9]">
            <Button>Save Preferences</Button>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#DC2626]" />
            </div>
            <h2 className="text-base font-semibold text-[#0F172A]">Security</h2>
          </div>

          <div className="space-y-1">
            {[
              { title: 'Two-factor authentication', desc: 'Add an extra layer of security to your account', checked: false },
              { title: 'Session timeout', desc: 'Automatically log out after 30 minutes of inactivity', checked: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3.5 px-3 -mx-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                <div>
                  <div className="text-sm font-medium text-[#0F172A]">{item.title}</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">{item.desc}</div>
                </div>
                <Switch defaultChecked={item.checked} />
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-[#F1F5F9]">
            <Button variant="outline">Change Password</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
