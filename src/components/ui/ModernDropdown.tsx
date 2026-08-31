'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
  description?: string;
}

interface ModernDropdownProps {
  label?: string;
  required?: boolean;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
  icon?: React.ReactNode;
  onAddNew?: () => void;
  addNewText?: string;
  searchable?: boolean;
  className?: string;
}

export function ModernDropdown({
  label,
  required = false,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  disabledPlaceholder,
  icon,
  onAddNew,
  addNewText = '+ Add New',
  searchable = true,
  className,
}: ModernDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen, searchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={cn('space-y-1.5 relative', className)} ref={dropdownRef}>
      {/* Label and Add New Button */}
      {(label || onAddNew) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {icon}
              <span>{label}</span>
              {required && <span className="text-rose-500">*</span>}
            </label>
          )}
          {onAddNew && !disabled && (
            <button
              type="button"
              onClick={onAddNew}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:underline flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>{addNewText}</span>
            </button>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none',
          'bg-slate-50/90 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800',
          'hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-900',
          isOpen && 'ring-2 ring-emerald-500/20 border-emerald-500 dark:border-emerald-500 shadow-sm',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/50'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon ? (
            <div className="shrink-0 text-emerald-600 dark:text-emerald-400">
              {selectedOption.icon}
            </div>
          ) : icon ? (
            <div className="shrink-0 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          ) : null}

          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge !== undefined && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 leading-none">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
              {disabled && disabledPlaceholder ? disabledPlaceholder : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedOption && !disabled && !required && (
            <div
              onClick={handleClear}
              className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </div>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isOpen && 'rotate-180 text-emerald-600 dark:text-emerald-400'
            )}
          />
        </div>
      </button>

      {/* Floating Popover Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-72">
          {/* Search Box inside dropdown */}
          {searchable && options.length > 5 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="p-1.5 overflow-y-auto space-y-0.5 flex-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer',
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/60'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {option.icon && (
                        <div
                          className={cn(
                            'shrink-0',
                            isSelected
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          )}
                        >
                          {option.icon}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {option.badge !== undefined && (
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full border leading-none',
                            isSelected
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          )}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Create Action at Bottom */}
          {onAddNew && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/70">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200/80 dark:border-emerald-800/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addNewText}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
