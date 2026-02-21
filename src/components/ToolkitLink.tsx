import React from 'react';
import { ExternalLink } from 'lucide-react';

export function ToolkitLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group p-2 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
        >
            <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600 truncate">{label}</span>
            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 shrink-0" />
        </a>
    );
}
