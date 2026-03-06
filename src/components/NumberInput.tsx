import type { LucideIcon } from 'lucide-react';

export interface NumberInputProps {
    label: string;
    icon: LucideIcon;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    onChange: (val: number) => void;
    onMaxChange?: (val: number) => void;
}

export function NumberInput({ label, icon: Icon, value, min = 0, max = 100, step = 0.1, unit, onChange, onMaxChange }: NumberInputProps) {
    return (
        <div className="flex items-center gap-2 py-1 group" >
            {/* Icon with Tooltip */}
            <div className="text-slate-400 group-hover:text-indigo-500 transition-colors cursor-help" title={label}>
                <Icon size={16} />
            </div>

            {/* Slider */}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            {/* Current Value / Manual Input */}
            <div className="flex items-center gap-0.5">
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className="w-12 text-right text-[11px] p-0.5 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none font-mono text-slate-700"
                />
                {unit && <span className="text-[10px] text-slate-400 font-medium">{unit}</span>}
            </div>

            {/* Max Limit Input */}
            {onMaxChange && (
                <div className="flex items-center border-l border-slate-100 pl-2 ml-1" title="Slider Max Value">
                    <span className="text-[9px] text-slate-300 font-bold mr-1">M</span>
                    <input
                        type="number"
                        min={min + step}
                        value={max}
                        onChange={(e) => onMaxChange(parseFloat(e.target.value) || 1)}
                        className="w-10 text-[10px] p-0.5 bg-slate-50 border border-slate-100 rounded text-slate-400 focus:text-indigo-600 outline-none transition-all"
                    />
                </div>
            )}
        </div>
    );
}
