'use client';

import { useState } from 'react';
import { ModelSelector } from './ModelSelector';
import { DEFAULT_MODEL } from '@/lib/ai/models';

export function DocumentAgent() {
  const [content, setContent] = useState('');
  const [action, setAction] = useState<'summarize' | 'qa' | 'analyze'>('summarize');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Lütfen bir döküman içeriği girin');
      return;
    }

    if (action === 'qa' && !question.trim()) {
      alert('Lütfen bir soru girin');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/agent/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          action,
          question: action === 'qa' ? question : undefined,
          stream: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Agent işlemi başarısız');
      }

      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const exampleDocs = {
    readme: `# DevAgents Platform

AI-powered development agent platform for automating workflows.

## Features
- Document analysis with AI
- GitHub integration
- Workflow automation
- Multi-agent orchestration`,
    
    code: `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`,
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  return (
    <div className="space-y-4">
      {/* Model Selector */}
      <ModelSelector 
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />

      {/* Action Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setAction('summarize')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            action === 'summarize'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📝 Özetle
        </button>
        
        <button
          onClick={() => setAction('analyze')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            action === 'analyze'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔍 Analiz Et
        </button>
        
        <button
          onClick={() => setAction('qa')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            action === 'qa'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          💬 Soru Sor
        </button>
      </div>

      {/* Example Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setContent(exampleDocs.readme)}
          className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
        >
          Örnek README
        </button>
        <button
          onClick={() => setContent(exampleDocs.code)}
          className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
        >
          Örnek Kod
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Content */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Döküman İçeriği
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dökümanınızı buraya yapıştırın..."
            className="w-full h-40 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Question Input (only for QA) */}
        {action === 'qa' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sorunuz
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Döküman hakkında sormak istediğiniz soru..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>İşleniyor...</span>
            </>
          ) : (
            <>
              <span>🤖</span>
              <span>Agent'ı Çalıştır</span>
            </>
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-6 p-4 bg-gray-900 border border-gray-600 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <span>✨</span>
            Sonuç
          </h3>
          <div className="text-gray-200 whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  );
}

