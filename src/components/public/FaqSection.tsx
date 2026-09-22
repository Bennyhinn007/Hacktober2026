'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, MapPin, Phone } from 'lucide-react';
import { EVENT_INFO } from '@/lib/constants';

const FAQ_ITEMS = [
  {
    q: 'How does the dynamic pricing tier work?',
    a: 'Registration fees are tiered based on the total number of events you select: 1 Event costs ₹79, 3 Events cost ₹199, and all 5 Events cost ₹350. Combinations of 2 and 4 events are currently unfinalized and will be confirmed by organizers.',
  },
  {
    q: 'Can an individual register for both individual and team events?',
    a: 'Yes! A participant can participate in multiple events. When you select a team event (Mini Hackathon or Cyber Hunt), you will be prompted to enter your team name and up to 3 additional team members.',
  },
  {
    q: 'What is the maximum team size for Mini Hackathon and Cyber Hunt?',
    a: 'Each team can have a maximum of 4 members (1 Team Leader who registers + up to 3 additional members). No more than 4 members are allowed.',
  },
  {
    q: 'What happens after I submit my registration and payment screenshot?',
    a: 'You will receive a unique Registration ID (format: HT26-XXXXXX) along with a verification QR pass. Your payment status will be marked as PENDING. Once the organizing committee verifies your transaction UTR against bank records, your status will update to VERIFIED.',
  },
  {
    q: 'What should I bring on event day (3 October 2026)?',
    a: 'All participants must bring their original College Student ID card and their digital or printed Hacktober 2026 Confirmation Pass containing their QR code for event check-in.',
  },
  {
    q: 'What are the prizes for winning participants?',
    a: 'Per official guidelines, prizes will be announced as an exciting surprise by the Department of CSE & Cyber during the event!',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 lg:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* FAQ Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold uppercase tracking-wider mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>Clarifications</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:text-teal-700"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                          isOpen ? 'rotate-180 text-teal-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact / Venue Info Card */}
          <div id="contact" className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Contact & Venue Inquiries</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Department of CSE, IoT and Cybersecurity including Blockchain Technology
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Campus Address</span>
                    <p className="text-slate-600">
                      Guru Nanak Dev Engineering College, Mailoor Road, Bidar, Karnataka — 585403
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Official Support Email</span>
                    <p className="text-slate-600 font-mono">{EVENT_INFO.contactEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Organizer Helpline</span>
                    <p className="text-slate-600 font-mono">{EVENT_INFO.contactPhone}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
                <span>Faculty Coordinators: <strong className="text-slate-800">[TBD]</strong></span>
                <p className="mt-1">
                  For immediate assistance during registration, visit the Department office during college hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
