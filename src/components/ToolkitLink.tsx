import React from 'react';
import { ExternalLink } from 'lucide-react';

export function ToolkitLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group p-1 underline rounded-lg border border-slate-800 hover:border-indigo-500 hover:bg-slate-800 transition-all"
        >
            <span className="text-xs font-medium text-slate-200 group-hover:text-indigo-400 truncate">{label}</span>
            <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-indigo-400 shrink-0" />
        </a>
    );
}
