import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { parseResponse } from '../lib/responseParser';

export function ContentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const response = await fetch('https://hook.us1.make.com/s4jp42axkryyksupz8e91wly42bnytyw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          timestamp: new Date().toISOString(),
          userId: user.id 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await parseResponse(response);
      
      if (!content) {
        throw new Error('No content received from the API');
      }

      const { error: dbError } = await supabase
        .from('content')
        .insert([
          {
            prompt,
            generated_content: content,
            user_id: user.id,
            created_at: new Date().toISOString(),
          },
        ]);

      if (dbError) throw dbError;
      
      toast.success('Content generated successfully!');
      setPrompt('');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(
        error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Failed to generate content'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      generateContent();
    }
  };

  return (
    <div className="w-full max-w-2xl p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt here... (⌘ + Enter to generate)"
            className="w-full h-32 p-4 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
            ⌘ + Enter to generate
          </div>
        </div>
        <button
          onClick={generateContent}
          disabled={isLoading || !prompt.trim()}
          className="w-full py-3 px-6 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-lg transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Generate Content
            </>
          )}
        </button>
      </div>
    </div>
  );
}