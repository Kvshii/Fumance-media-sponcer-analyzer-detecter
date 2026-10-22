'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Mail, MessageSquare, Shield, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const supportEmail = 'kashiiaslam.13@gmail.com';
  const discordUrl = 'https://discord.gg/your-discord-link';

  return (
    <footer className="mt-20 border-t border-slate-900 bg-slate-950/90 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Flame className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              Fumance<span className="text-cyan-400">Media</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Next-generation YouTube sponsor detection engine. Empowering creators, brand managers, and viewers with automated timestamp extraction, duration metrics, and sponsor analytics.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Fumance Discord Community
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
            Navigation
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/" className="hover:text-cyan-400 transition-colors">
                Dashboard & Analyzer
              </Link>
            </li>
            <li>
              <Link href="/history" className="hover:text-purple-400 transition-colors">
                Saved Analysis Runs
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${supportEmail}`}
                className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                Support & Inquiries
              </a>
            </li>
          </ul>
        </div>

        {/* Contact & Support */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
            Support & Legal
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Direct Contact Email</span>
                <a href={`mailto:${supportEmail}`} className="text-slate-200 hover:text-cyan-300 font-mono text-xs">
                  {supportEmail}
                </a>
              </div>
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-purple-400 shrink-0" />
              SponsorBlock API Powered
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {currentYear} Fumance Media. All rights reserved.</p>
        <p className="flex items-center gap-1 text-slate-500">
          Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5" /> for modern YouTube creators & researchers.
        </p>
      </div>
    </footer>
  );
};
