'use client';

import { useState } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  error?: string;
}

export default function ColorPicker({ label, value, onChange, error }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Valider le format hex avant d'appeler onChange
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex items-center gap-3">
        {/* Color input natif */}
        <input
          type="color"
          value={inputValue}
          onChange={handleColorInputChange}
          className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
        />
        
        {/* Text input pour hex */}
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="#FF6B35"
          maxLength={7}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Preview */}
        <div
          className="h-10 w-10 rounded border-2 border-gray-300"
          style={{ backgroundColor: inputValue }}
          title={inputValue}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
