'use client';

import { useState } from 'react';
import { FREE_MODELS, MODEL_DESCRIPTIONS } from "@/shared/lib/ai/models";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const models = Object.entries(FREE_MODELS);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
      >
        <div>
          <div className="text-sm text-gray-400">Model</div>
          <div className="font-medium">
            {Object.entries(FREE_MODELS).find(([_, value]) => value === selectedModel)?.[0] || 'Unknown'}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 top-full mt-2 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
            {models.map(([key, value]) => (
              <button
                key={value}
                onClick={() => {
                  onModelChange(value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                  selectedModel === value ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white">{key}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {MODEL_DESCRIPTIONS[value as keyof typeof MODEL_DESCRIPTIONS]}
                    </div>
                  </div>
                  {selectedModel === value && (
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

