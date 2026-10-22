'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, History, Home, MessageSquare, Mail, Sparkles, ExternalLink, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const discordUrl = 'https://discord.gg/your-discord-link';
  const supportEmail = 'kashiiaslam.13@gmail.com';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070a12]/85 border-b border-slate-800/80 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-glow-indigo group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#070a12] rounded-[11px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-cyan-400 group-hover:text-indigo-400 transition-colors animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-0.5">
                Fumance<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Media</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold -mt-1 flex items-center gap-1">
                Sponsor Radar <Sparkles className="w-2.5 h-2.5 text-indigo-400 inline" />
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white px-4 py-2 rounded-lg hover:bg-indigo-600/20 transition-all"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              Dashboard
            </Link>
            <Link 
              href="/history" 
              className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white px-4 py-2 rounded-lg hover:bg-purple-600/20 transition-all"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              Analyzed History
            </Link>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 hover:border-purple-400 transition-all shadow-md group"
            >
              <MessageSquare className="w-4 h-4 text-purple-300 group-hover:scale-110 transition-transform" />
              Join Discord
              <ExternalLink className="w-3 h-3 text-purple-300 opacity-70" />
            </a>

            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-200 bg-slate-900/90 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition-all"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              Contact Support
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#070a12]/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900 border border-slate-800/60"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            Dashboard
          </Link>
          <Link
            href="/history"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900 border border-slate-800/60"
          >
            <History className="w-4 h-4 text-purple-400" />
            Analyzed History
          </Link>
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-purple-600/30 border border-purple-500/40"
            >
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Join Discord Community
            </a>
            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-200 bg-slate-900 border border-slate-800"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              Contact Support ({supportEmail})
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
