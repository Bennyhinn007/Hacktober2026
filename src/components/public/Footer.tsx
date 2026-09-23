import Link from 'next/link';
import Image from 'next/image';
import { Shield, MapPin, Calendar, Mail, Phone, Lock, ExternalLink } from 'lucide-react';
import { EVENT_INFO } from '@/lib/constants';

interface FooterProps {
  initialEventInfo?: typeof EVENT_INFO;
}

export default function Footer({ initialEventInfo }: FooterProps = {}) {
  const eventInfo = initialEventInfo || EVENT_INFO;
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Institution & Event Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-teal-200 shadow-xs flex items-center justify-center shrink-0">
                <Image
                  src="/logo-circle.png"
                  alt="Hacktober 2026 Official Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-mokoto text-xl tracking-wider text-slate-900 block">
                  HACKTOBER <span className="text-teal-600">2026</span>
                </span>
                <p className="text-[11px] text-teal-800 font-semibold uppercase tracking-wider">
                  Cyber Samurai Association
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              Organized by the{' '}
              <strong className="text-slate-900 font-semibold">{eventInfo.department}</strong> at{' '}
              <strong className="text-slate-900 font-semibold">{eventInfo.institution}</strong>.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{eventInfo.dates}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{eventInfo.venue || 'Guru Nanak Dev Engineering College, Mailoor Road, Bidar, Karnataka'}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-teal-700 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-teal-700 transition-colors">
                  5 Signature Events
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-teal-700 transition-colors">
                  Event Timeline
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-teal-700 transition-colors">
                  Rules & Code of Conduct
                </Link>
              </li>
              <li>
                <Link href="/register" className="font-semibold text-slate-900 hover:text-teal-700">
                  Register Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Help & Inquiries
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Email: {eventInfo.contactEmail}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>Helpline: {eventInfo.contactPhone}</span>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-teal-700 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/rules#disclaimer" className="hover:text-teal-700 transition-colors">
                  Terms & Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Organizers Portal */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Organizers
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Authorized faculty and student committee members can sign in to verify payments and manage attendance.
            </p>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Admin Access</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            &copy; 2026 CSE(IoT &amp; Cybersecurity Including Blockchain Technology). All Rights Reserved.
          </p>
          <p className="text-center sm:text-right text-slate-500">
            <span>Designed &amp; Developed by </span>
            <span className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">
              Bennyhinn
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
