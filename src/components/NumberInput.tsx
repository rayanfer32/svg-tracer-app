import React from 'react';

export interface NumberInputProps {
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    onChange: (val: number) => void;
}

export function NumberInput({ label, value, min, max, step, unit, onChange }: NumberInputProps) {
    return (
        <div className="flex justify-between items-center text-sm" >
            <label className="text-slate-700" > {label} </label>
            <div className="flex items-center gap-1">
                <input
                    type="number"
                    min={min} max={max} step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className="w-16 text-right text-xs p-1 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-600"
                />
                {unit && <span className="text-xs text-slate-400 font-medium w-3">{unit}</span>}
            </div>
        </div>
    );
}
