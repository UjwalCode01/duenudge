'use client';

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface SupabaseNoticeProps {
  isConfigured: boolean;
}

export function SupabaseNotice({ isConfigured }: SupabaseNoticeProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isConfigured) return null;

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(
      `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span className="font-semibold text-amber-800">
            Supabase Connection Pending:
          </span>
          <span className="text-amber-700">
            Set your Supabase credentials in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-xs">.env.local</code> to enable live database sync & auth.
          </span>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 inline-flex items-center underline"
          >
            {expanded ? 'Hide Setup Guide' : 'View Setup Guide'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-amber-200/80 text-xs text-amber-900 space-y-2">
          <p className="font-medium text-amber-950">Follow these 3 quick steps to connect Supabase:</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-800">
            <li>
              Create a free project at{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold inline-flex items-center text-indigo-700"
              >
                supabase.com <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </li>
            <li>
              Copy the SQL from <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">supabase/schema.sql</code> and run it in the Supabase <strong>SQL Editor</strong>.
            </li>
            <li>
              Copy your Project URL and Anon API Key from <strong>Project Settings → API</strong> into <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env.local</code>.
            </li>
          </ol>

          <div className="mt-2 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between font-mono text-[11px]">
            <span>NEXT_PUBLIC_SUPABASE_URL=...<br />NEXT_PUBLIC_SUPABASE_ANON_KEY=...</span>
            <button
              onClick={copyEnvSnippet}
              className="inline-flex items-center px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-sans font-medium text-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy sample'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
