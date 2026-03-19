import { FilterProvider } from '@/components/FilterContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { Toaster } from 'sonner';
import { prisma } from '@/lib/prisma';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const latestRun = await prisma.dataRun.findFirst({
    where: { status: 'complete' },
    orderBy: { runAt: 'desc' },
    select: { runAt: true },
  });
  const lastRunAt = latestRun
    ? latestRun.runAt.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' ET'
    : undefined;

  return (
    <FilterProvider>
      <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
        <Sidebar lastRunAt={lastRunAt} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-[1280px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </FilterProvider>
  );
}
