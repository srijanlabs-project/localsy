import React from 'react';
import { BookOpen, Server, Layers, Smartphone, Settings, Globe } from 'lucide-react';

export default function ProposalPanel() {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-blue-500/20 shadow-2xl p-6 md:p-8 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-mono mb-2">
          <BookOpen className="w-3.5 h-3.5" /> Project Blueprint &amp; Specs
        </div>
        <h2 className="text-2xl font-bold font-sans tracking-tight text-white mb-1">
          Yellow Pages Platform Architecture
        </h2>
        <p className="text-sm text-slate-400">
          Recommended production architecture and services to build a scalable multi-locality business directory.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Core Tech Stack */}
        <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-blue-400">
            <Server className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100 text-sm font-mono uppercase tracking-wide">
              Backend &amp; Infrastructure
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <strong className="text-white">API Gateway:</strong> Node.js + Express.js API framework running in Docker containers. Handles token decoding, rate-limiting, and search proxying.
            </li>
            <li>
              <strong className="text-white">Database System:</strong> PostgreSQL database containing multi-tenant structures mapped by `locality_id`. Utilizing PostGIS extension for geo-distance local search calculations.
            </li>
            <li>
              <strong className="text-white">Domain Manager:</strong> Wildcard SSL routing using NGINX Server Block or OpenResty. Automates Let&apos;s Encrypt certificate generation for custom mapped subdomains.
            </li>
          </ul>
        </div>

        {/* Feature Service Breakdown */}
        <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <Layers className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100 text-sm font-mono uppercase tracking-wide">
              Core Platform Services
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <strong className="text-white font-sans">Multi-Tenant Locality Management:</strong> Engine allocating configuration parameters, categories, and cover images scoped directly under localized domains.
            </li>
            <li>
              <strong className="text-white">Applicant Intake Pipeline:</strong> Safe form uploading logos and proof-of-ownership documents into Cloud Storage, firing pending webhook events to Slack.
            </li>
            <li>
              <strong className="text-white">Moderation &amp; Review Panel:</strong> Backend panel logging audits, validating addresses, and checking business tax credentials before single-click listing publishing.
            </li>
          </ul>
        </div>

        {/* Clients & Synchronization */}
        <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-3 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 text-indigo-400">
            <Smartphone className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100 text-sm font-mono uppercase tracking-wide">
              Android WebView &amp; Web APP
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <strong className="text-white">Android Shell Container:</strong> Android Studio Gradle project wrapping a secure Android WebView tailored with standard Chrome Clients.
            </li>
            <li>
              <strong className="text-white">JavaScript Interface Bridge:</strong> Dynamic Android native interface allowing JavaScript within the web views to call native intents directly (e.g. initiating Phone Calls, triggered share-sheets, Geolocation tracking).
            </li>
            <li>
              <strong className="text-white">Offline Synced Cache:</strong> ServiceWorker storage of local search indexes for lightning fast offline queries when mobile signals drop.
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-950/30 border border-blue-500/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="font-medium text-blue-200 text-sm flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-blue-400" />
            Dynamic Locality Routing Simulation
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Our interactive simulator below runs a local simulation engine where you can click to toggle subdomains like 
            <code className="text-emerald-400 px-1 mx-0.5 rounded bg-slate-900">nyc.yellowpages.io</code> or 
            <code className="text-emerald-400 px-1 mx-0.5 rounded bg-slate-900">london.yellowpages.io</code>, apply to register new local stores, and moderate them!
          </p>
        </div>
        <div className="text-xs text-slate-400/80 font-mono hidden md:block">
          Draft Spec v1.4
        </div>
      </div>
    </div>
  );
}
