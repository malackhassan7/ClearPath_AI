import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Database,
  ExternalLink,
  FileCheck2,
  MapPin,
  MessageSquare,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

export function LandingPage(): JSX.Element {
  return (
    <div className="landing-page min-h-screen bg-[#faf8f3] text-slate-800">
      {/* ── Top Header ─────────────────────────────────────── */}
      <header className="border-b border-border bg-white/90 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
                fill="#ffffff"
                stroke="#faf8f3"
                strokeWidth="1.2"
              />
            </svg>
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-slate-900 tracking-tight block leading-tight">
              DairySetu<span className="text-primary">-TN</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Tamil Nadu Dairy Ecosystem
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link to="/login" className="text-slate-700 hover:text-primary transition">
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white transition shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="relative px-6 pt-16 pb-20 max-w-7xl mx-auto overflow-hidden">
        {/* Abstract Fluid Milk SVG Curves in Background */}
        <div className="absolute inset-0 pointer-events-none -z-10 opacity-40">
          <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <path
              d="M0,150 C250,300 450,50 700,200 C900,320 1000,100 1000,100 L1000,600 L0,600 Z"
              fill="#eaf4f0"
            />
            <path
              d="M0,280 C300,180 550,420 800,240 C950,150 1000,280 1000,280 L1000,600 L0,600 Z"
              fill="#f4f1eb"
              opacity="0.7"
            />
          </svg>
        </div>

        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6">
            <ShieldCheck size={14} />
            <span>Official Government Data Integration • FSSAI FoSCoS & data.gov.in</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-slate-900 leading-tight">
            One Platform for Every Dairy Stakeholder in <span className="text-primary">Tamil Nadu</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            A unified digital ecosystem bridging dairy farmers, BMC collection centres, chilling plants,
            retail parlours, and franchise applicants with statutory FSSAI compliance, brand benchmarking, and market opportunity intelligence.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>Explore Platform Workspace</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/chatbot"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-border text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition"
            >
              <MessageSquare size={15} className="text-primary" />
              <span>Ask DairySetu AI Assistant</span>
            </Link>
          </div>
        </div>

        {/* ── Key Quantitative Pillars Counter ──────────────── */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white border border-border shadow-xs text-center">
            <span className="text-2xl lg:text-3xl font-serif font-bold text-primary block">30</span>
            <span className="text-xs text-slate-500 font-medium">Tamil Nadu Districts</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-border shadow-xs text-center">
            <span className="text-2xl lg:text-3xl font-serif font-bold text-primary block">10 Years</span>
            <span className="text-xs text-slate-500 font-medium">Time-Series Data (data.gov.in)</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-border shadow-xs text-center">
            <span className="text-2xl lg:text-3xl font-serif font-bold text-primary block">3-Tier</span>
            <span className="text-xs text-slate-500 font-medium">Honest Document Verification</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-border shadow-xs text-center">
            <span className="text-2xl lg:text-3xl font-serif font-bold text-primary block">100%</span>
            <span className="text-xs text-slate-500 font-medium">Official Sourced Standards</span>
          </div>
        </div>
      </section>

      {/* ── Three-Column Target Audience Section ────────────── */}
      <section className="px-6 py-16 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Stakeholder Hub</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              Engineered for the Full Dairy Lifecycle
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Farmers & Producers */}
            <div className="p-6 rounded-2xl bg-[#faf8f3] border border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                  <Users size={20} />
                </div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Farmers & Milk Producers
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Track procurement rates, access welfare subsidies, verify milko-tester calibrations, and resolve payment disputes transparently through dedicated grievance redressal.
                </p>
              </div>
              <ul className="mt-4 pt-4 border-t border-slate-200/60 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-primary shrink-0" />
                  <span>Kisan Credit Card (KCC) scheme guidance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-primary shrink-0" />
                  <span>Transparent grievance filing for BMC delays</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Entrepreneurs & Franchise Applicants */}
            <div className="p-6 rounded-2xl bg-[#faf8f3] border border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                  <Scale size={20} />
                </div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Entrepreneurs & Franchisees
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Automatically determine whether you require an FSSAI Registration Certificate (Form A) or State/Central License (Form B), compare brand franchise deposits, and evaluate milk surplus districts.
                </p>
              </div>
              <ul className="mt-4 pt-4 border-t border-slate-200/60 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-primary shrink-0" />
                  <span>FSSAI FoSCoS statutory rule engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-primary shrink-0" />
                  <span>Aavin vs Dodla vs Hatsun franchise comparison</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Officers & Consultants */}
            <div className="p-6 rounded-2xl bg-[#faf8f3] border border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  FSSAI Officers & Consultants
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Expedite case reviews with automated Tier 1 (format/OCR) and Tier 2 (cross-doc consistency) flags, record mandatory regulatory rationales, and maintain an immutable audit trail.
                </p>
              </div>
              <ul className="mt-4 pt-4 border-t border-slate-200/60 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-primary shrink-0" />
                  <span>3-tier honest document verification workflow</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-primary shrink-0" />
                  <span>Full regulatory review queue with audit logs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 Core Capabilities Grid ────────────────────────── */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
            Built for Explainability & Public Trust
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:shadow-sm transition">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center mb-3">
              <Scale size={18} />
            </div>
            <h4 className="font-serif font-bold text-sm text-slate-900">FSSAI Rule Engine</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Maps daily capacity (LPD) and annual turnover to exact FoSCoS registration tiers and statutory fee schedules (Form A/B).
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:shadow-sm transition">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center mb-3">
              <MapPin size={18} />
            </div>
            <h4 className="font-serif font-bold text-sm text-slate-900">District Opportunity Finder</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Analyzes real milk production figures from data.gov.in (2009–2019) to rank districts by growth rate and raw milk surplus.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:shadow-sm transition">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center mb-3">
              <Tag size={18} />
            </div>
            <h4 className="font-serif font-bold text-sm text-slate-900">Brand Benchmarking</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Side-by-side comparison of Aavin FRO requirements with private brands like Dodla and Hatsun, clearly distinguishing verified vs unverified data.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:shadow-sm transition">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center mb-3">
              <MessageSquare size={18} />
            </div>
            <h4 className="font-serif font-bold text-sm text-slate-900">Grounded RAG Chatbot</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Answers compliance queries in Tamil and English strictly from ingested government reference PDFs, providing page-number citations.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:shadow-sm transition">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center mb-3">
              <FileCheck2 size={18} />
            </div>
            <h4 className="font-serif font-bold text-sm text-slate-900">Honest Document Verification</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Performs structural checks (format, size, text extraction) and name/address cross-matching without falsely claiming AI forgery detection.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:shadow-sm transition">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center mb-3">
              <BadgePercent size={18} />
            </div>
            <h4 className="font-serif font-bold text-sm text-slate-900">Government Schemes Portal</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Direct access to NPDD subsidies, DIDF modernization credit, and KCC working capital loans with links to official portals.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white px-6 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <b>DairySetu-TN:</b> A Unified Digital Platform for the Tamil Nadu Dairy Ecosystem.
          </div>
          <div>
            All compliance and milk production figures cited from official publications. Final determination rests with authorized FSSAI officers.
          </div>
        </div>
      </footer>
    </div>
  );
}
