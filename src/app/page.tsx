'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json() as { id?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      router.push(`/analyze/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
            AI-Powered Creative Generator
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight">
            Generate Ad Creatives From Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Brand DNA
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Enter your website URL and we&apos;ll analyze your brand, research competitors, and generate professional ad creatives in minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <Input
            type="url"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-12 text-base"
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {loading ? 'Starting...' : 'Analyze Brand →'}
          </Button>
        </form>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 text-left">
          {[
            {
              icon: '🔍',
              title: 'Brand Analysis',
              desc: 'Extracts colors, fonts, tone, and audience from your website automatically.',
            },
            {
              icon: '🏆',
              title: 'Competitor Research',
              desc: 'Identifies top competitors and analyzes their highest-performing ad patterns.',
            },
            {
              icon: '✨',
              title: 'AI Creatives',
              desc: 'Generates 3 professional ad creatives with copy tailored to your brand.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 space-y-2"
            >
              <div className="text-2xl">{feature.icon}</div>
              <h3 className="text-white font-semibold">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
