'use client';

import { useState } from 'react';
import { LlmResult, LlmAssessment } from './api/ask/route';

interface ApiResponse {
  question: string;
  results: LlmResult[];
  assessments: LlmAssessment[];
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LlmResult[]>([]);
  const [assessments, setAssessments] = useState<LlmAssessment[]>([]);
  const [lastQuestion, setLastQuestion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setResults([]);
    setAssessments([]);
    
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      setResults(data.results);
      setLastQuestion(data.question);
      
      // Handle assessments
      if (data.assessments && data.assessments.length > 0) {
        setAssessments(data.assessments);
      }
    } catch (error) {
      console.error('Error:', error);
      // Create error results for all providers
      const errorResults: LlmResult[] = [
        { provider: 'openai', ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { provider: 'anthropic', ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { provider: 'gemini', ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { provider: 'mistral', ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      ];
      setResults(errorResults);
      setLastQuestion(question.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getProviderDisplayName = (provider: string) => {
    const names = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Google Gemini',
      mistral: 'Mistral',
    };
    return names[provider as keyof typeof names] || provider;
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      openai: 'border-green-200 bg-green-50',
      anthropic: 'border-orange-200 bg-orange-50',
      gemini: 'border-blue-200 bg-blue-50',
      mistral: 'border-purple-200 bg-purple-50',
    };
    return colors[provider as keyof typeof colors] || 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LLM Comparison Tool
          </h1>
          <p className="text-gray-600">
            Ask the same question to OpenAI, Anthropic, Google Gemini, and Mistral simultaneously
          </p>
        </div>

        {/* Input Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                Your Question
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your question here... (Press Enter to submit, Shift+Enter for new line)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Asking & Analyzing...' : 'Ask All Providers'}
            </button>
          </form>
        </div>

        {/* Results */}
        {(results.length > 0 || loading) && (
          <div className="space-y-6">
            {lastQuestion && (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Question: &ldquo;{lastQuestion}&rdquo;
                </h2>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {['OpenAI', 'Anthropic', 'Google Gemini', 'Mistral'].map((provider) => (
                  <div key={provider} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">{provider}</h3>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                    <div className="text-gray-500">Waiting for response...</div>
                  </div>
                ))}
              </div>
            )}

            {/* Results Grid */}
            {results.length > 0 && !loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.map((result) => (
                  <div
                    key={result.provider}
                    className={`bg-white rounded-lg border-2 p-6 ${getProviderColor(result.provider)}`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">
                        {getProviderDisplayName(result.provider)}
                      </h3>
                      {result.latencyMs && (
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                          {result.latencyMs}ms
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      {result.ok ? (
                        <>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {result.text}
                          </div>
                          {result.finishReason && (
                            <div className="text-xs text-gray-500">
                              Finish reason: {result.finishReason}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                          <div className="font-medium mb-1">Error:</div>
                          <div className="whitespace-pre-wrap">{result.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assessments Section */}
            {assessments.length > 0 && !loading && (
              <div className="mt-12">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    AI Assessments & Analysis
                  </h2>
                  <p className="text-gray-600">
                    Each AI provider evaluates all responses, providing assessments, summaries, and fact-checking.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.provider}
                      className={`bg-white rounded-lg border-2 p-6 ${getProviderColor(assessment.provider)}`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-800">
                          {getProviderDisplayName(assessment.provider)} Analysis
                        </h3>
                        {assessment.latencyMs && (
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            {assessment.latencyMs}ms
                          </span>
                        )}
                      </div>

                      {/* Assessment Content */}
                      <div className="space-y-3">
                        {assessment.ok ? (
                          <>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {assessment.assessment}
                            </div>
                            {assessment.finishReason && (
                              <div className="text-xs text-gray-500">
                                Finish reason: {assessment.finishReason}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                            <div className="font-medium mb-1">Assessment Error:</div>
                            <div className="whitespace-pre-wrap">{assessment.error}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {results.length === 0 && !loading && (
          <div className="max-w-2xl mx-auto text-center text-gray-600">
            <p className="mb-4">
              Enter a question above to compare responses from all four AI providers.
            </p>
            <p className="text-sm">
              Make sure you have set up your API keys in the <code className="bg-gray-200 px-1 rounded">.env.local</code> file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
