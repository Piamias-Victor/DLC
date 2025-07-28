// src/components/molecules/MultiSelectFilter.tsx
import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  options: Option[];
  selectedValues: string[] | 'ALL';
  onChange: (values: string[] | 'ALL') => void;
  placeholder: string;
  allLabel?: string;
}

export function MultiSelectFilter({ 
  options, 
  selectedValues, 
  onChange, 
  placeholder,
  allLabel = "Tous" 
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = selectedValues === 'ALL';
  const selectedArray = Array.isArray(selectedValues) ? selectedValues : [];

  const handleOptionToggle = (value: string) => {
    if (value === 'ALL') {
      onChange('ALL');
      return;
    }

    if (isAllSelected) {
      onChange([value]);
      return;
    }

    const newSelection = selectedArray.includes(value)
      ? selectedArray.filter(v => v !== value)
      : [...selectedArray, value];

    onChange(newSelection.length === 0 ? 'ALL' : newSelection);
  };

  const getDisplayText = () => {
    if (isAllSelected) return allLabel;
    if (selectedArray.length === 0) return allLabel;
    if (selectedArray.length === 1) {
      const option = options.find(o => o.value === selectedArray[0]);
      return option?.label || selectedArray[0];
    }
    return `${selectedArray.length} sélectionnés`;
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('ALL');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 text-left"
      >
        <span className={isAllSelected ? 'text-gray-500' : 'text-gray-900'}>
          {getDisplayText()}
        </span>
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {!isAllSelected && selectedArray.length > 0 && (
            <div
              onClick={clearSelection}
              className="p-0.5 hover:bg-gray-100 rounded cursor-pointer"
              title="Effacer sélection"
            >
              <X className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {/* Option "Tous" */}
          <label className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              checked={isAllSelected}
              onChange={() => handleOptionToggle('ALL')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
              isAllSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
            }`}>
              {isAllSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-gray-700">{allLabel}</span>
          </label>

          <div className="border-t border-gray-100"></div>

          {/* Options individuelles */}
          {options.map((option) => {
            const isSelected = selectedArray.includes(option.value);
            return (
              <label 
                key={option.value} 
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleOptionToggle(option.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}