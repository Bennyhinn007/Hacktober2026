'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  QrCode,
  Calendar,
  DollarSign,
  Settings,
  ShieldAlert,
  FileSpreadsheet,
  LogOut,
  Shield,
  Menu,
  X,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import type { AdminPayload } from '@/lib/auth/jwt';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminPayload | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (!res.ok || !json.success) {
          router.push('/admin/login');
          return;
        }
        setAdmin(json.user);
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Registrations', href: '/admin/registrations', icon: Users },
    { label: 'Teams Roster', href: '/admin/teams', icon: Users },
    { label: 'Payments Queue', href: '/admin/payments', icon: CreditCard },
    { label: 'QR Attendance', href: '/admin/attendance', icon: QrCode },
    { label: 'Event Schedule', href: '/admin/schedule', icon: Calendar },
    { label: 'Dynamic Pricing', href: '/admin/pricing', icon: DollarSign },
    ...(admin?.role === 'SUPER_ADMIN'
      ? [{ label: 'Organizer Access', href: '/admin/organizers', icon: UserCheck }]
      : []),
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-50 border border-teal-200 shrink-0">
            <Image
              src="/logo-circle.png"
              alt="Hacktober 2026 Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-mokoto text-sm text-slate-900 tracking-wide">HACKTOBER 2026</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col z-30 transition-transform md:translate-x-0 fixed md:static inset-y-0 left-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-50 border border-teal-200 shrink-0 shadow-2xs">
              <Image
                src="/logo-circle.png"
                alt="Hacktober 2026 Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-mokoto text-sm text-slate-900 block leading-tight">
                HACKTOBER 2026
              </span>
              <span className="text-[10px] text-teal-800 font-semibold uppercase tracking-wider block">
                Cyber Samurai Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Current Admin Badge */}
        {admin && (
          <div className="p-3 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-900 block truncate">{admin.fullName}</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-mono">
                {admin.email}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                  admin.role === 'SUPER_ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : admin.role === 'ADMIN'
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {admin.role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout / Footer */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <span>View Public Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
