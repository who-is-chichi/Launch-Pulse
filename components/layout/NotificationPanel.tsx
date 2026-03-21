'use client';
import { useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { useFilters } from '../FilterContext';
import Link from 'next/link';

// Types — keep minimal
type NotifInsight = { id: string; headline: string; severity: string };
type NotifAction = { id: string; title: string; owner: string; dueDate: string; status: string };

export function NotificationPanel() {
  const { brand } = useFilters();
  const [open, setOpen] = useState(false);
  const [insights, setInsights] = useState<NotifInsight[]>([]);
  const [actions, setActions] = useState<NotifAction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [insRes, actRes] = await Promise.all([
        fetch(`/api/insights?brand=${brand}&pageSize=5&severity=High`),
        fetch(`/api/actions?brand=${brand}&pageSize=5`),
      ]);
      if (insRes.ok) {
        const data = await insRes.json();
        // API returns { insights: [...] }
        setInsights(Array.isArray(data) ? data : (data.insights ?? []));
      }
      if (actRes.ok) {
        const data = await actRes.json();
        const arr: NotifAction[] = Array.isArray(data) ? data : (data.actions ?? []);
        // Only show non-done actions
        setActions(arr.filter(a => a.status !== 'done'));
      }
    } finally {
      setLoading(false);
    }
  }, [brand]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (val) fetchNotifications();
  };

  // Red dot: only if there are critical insights or any actions due today or earlier
  const today = new Date().toISOString().split('T')[0];
  const hasNotifications =
    insights.length > 0 || actions.some(a => a.dueDate <= today + 'T23:59:59');

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl">
          <Bell className="w-[18px] h-[18px] text-[#64748B]" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-[#0F172A]">Notifications</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : insights.length === 0 && actions.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[#64748B] text-center">No new notifications</div>
        ) : (
          <div className="divide-y max-h-80 overflow-y-auto">
            {insights.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-[#64748B] uppercase tracking-wide bg-gray-50">
                  Critical Insights
                </div>
                {insights.map(ins => (
                  <Link
                    key={ins.id}
                    href={`/insights/${ins.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2 px-4 py-3 hover:bg-gray-50 text-sm"
                  >
                    <span className="mt-0.5 w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                    <span className="text-[#0F172A] line-clamp-2">{ins.headline}</span>
                  </Link>
                ))}
              </div>
            )}
            {actions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-[#64748B] uppercase tracking-wide bg-gray-50">
                  Actions Due
                </div>
                {actions.map(act => (
                  <div key={act.id} className="flex items-start gap-2 px-4 py-3 text-sm">
                    <span className="mt-0.5 w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                    <div>
                      <div className="text-[#0F172A] line-clamp-1">{act.title}</div>
                      <div className="text-[#64748B] text-xs">
                        {act.owner} · Due {act.dueDate?.split('T')[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
