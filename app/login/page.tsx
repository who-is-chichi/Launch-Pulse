'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, BarChart3, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'motion/react';

const features = [
  { icon: BarChart3, label: 'Real-time demand & access analytics' },
  { icon: Target, label: 'Automated insight-to-action workflows' },
  { icon: Shield, label: 'Enterprise-grade data security' },
];

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/home');
    }
  };

  const handleSSO = async () => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sso@company.com', password: 'sso' }),
    });
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Left panel — branded */}
      <div
        className="hidden lg:flex w-[480px] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1E3A8A 0%, #1D4ED8 40%, #2563EB 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-16"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">Launch Pulse</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h2 className="text-3xl font-semibold text-white mb-4 leading-tight tracking-tight">
              Your commercial<br />launch command center
            </h2>
            <p className="text-blue-200 text-base leading-relaxed max-w-sm">
              Turn complex launch data into clear, actionable insights that drive measurable outcomes.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 space-y-4"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <Icon className="w-4 h-4 text-blue-200" />
                </div>
                <span className="text-sm text-blue-100 font-medium">{feature.label}</span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] p-8"
            style={{ boxShadow: 'var(--shadow-xl)' }}
          >
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.35)',
                }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight">Launch Pulse</h1>
            </div>

            <h2 className="text-xl font-semibold text-[#0F172A] mb-1 tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-[#94A3B8] mb-8">
              Sign in to access your commercial launch insights
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-[#334155]">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@company.com"
                  className="rounded-xl h-11 border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-[#334155]">Password</Label>
                  <button type="button" className="text-xs text-[#1D4ED8] font-medium hover:text-[#1E40AF]">Forgot password?</button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="rounded-xl h-11 border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white transition-colors"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl gap-2 text-sm">
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-[#94A3B8]">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl"
              onClick={handleSSO}
            >
              Sign in with SSO
            </Button>

            <p className="text-[11px] text-[#94A3B8] text-center mt-6">
              Your data is encrypted and secure. All access is logged and audited.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
