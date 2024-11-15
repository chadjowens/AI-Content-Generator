import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Content = Database['public']['Tables']['content']['Row'];

export function ContentHistory() {
  const [contents, setContents] = useState<Content[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const fetchContents = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch content history');
      return;
    }

    setContents(data || []);
  };

  // Set up real-time subscription
  useEffect(() => {
    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel('content_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'content',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchContents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
    fetchContents();
  }, []);

  const handleEdit = (content: Content) => {
    setEditingId(content.id);
    setEditedContent(content.generated_content);
  };

  const handleSave = async (id: number) => {
    const { error } = await supabase
      .from('content')
      .update({ generated_content: editedContent })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update content');
      return;
    }

    toast.success('Content updated successfully');
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete content');
      return;
    }

    toast.success('Content deleted successfully');
  };

  if (contents.length === 0) {
    return (
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Content History</h2>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No content generated yet. Try generating some content above!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Content History
        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
          ({contents.length} item{contents.length !== 1 ? 's' : ''})
        </span>
      </h2>
      <div className="space-y-4">
        {contents.map((content) => (
          <div
            key={content.id}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-transparent hover:border-yellow-400"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
                </p>
                <div className="flex gap-2">
                  {editingId === content.id ? (
                    <button
                      onClick={() => handleSave(content.id)}
                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors duration-200"
                      title="Save changes"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(content)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors duration-200"
                      title="Edit content"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors duration-200"
                    title="Delete content"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">Prompt:</p>
                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  {content.prompt}
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">Generated Content:</p>
                {editingId === content.id ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[8rem] p-4 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-y"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg whitespace-pre-wrap">
                    {content.generated_content}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}