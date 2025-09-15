import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useNotification } from '../contexts/AuthContext';
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';
import { QuizDisplay } from '../components/QuizDisplay'; // Import QuizDisplay

interface QuizQuestion {
  id: string;
  emojis: string[];
  choices: string[];
  correctIndex: number;
  bibleReference: string;
  hint?: string;
  explanation: string;
}

interface GeneratedQuiz {
  id: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  questions: QuizQuestion[];
  created_at: string;
  status: string;
  ai_model_used?: string;
  generation_metadata?: {
    aiModel: string;
    generationTime: number;
    validationScore: number;
  };
}

export function QuizGenerator() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);

  const difficulties = ['easy', 'medium', 'hard', 'extreme'];
  const questionCounts = [5, 10, 15, 20];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGeneratedQuiz(null);

    if (!user) {
      setError('You must be logged in to generate quizzes.');
      showNotification('You must be logged in to generate quizzes.', 'error');
      return;
    }

    if (!topic.trim()) {
      setError('Please enter a quiz topic.');
      showNotification('Please enter a quiz topic.', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data, error: edgeFunctionError } = await supabase.functions.invoke('quiz-generator', {
        body: JSON.stringify({ topic: topic.trim(), difficulty, numQuestions }),
      });

      if (edgeFunctionError) {
        throw edgeFunctionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedQuiz(data.quiz);
      showNotification('Quiz generated successfully! 🎉', 'success');
    } catch (err: any) {
      console.error('Error generating quiz:', err);
      setError(err.message || 'Failed to generate quiz. Please try again.');
      showNotification('Error generating quiz: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard/lessons"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Lessons Hub
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
            >
              🏠 Dashboard
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 mb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center drop-shadow-sm">
                AI Emoji Quiz Generator 🎮
              </h1>
              <p className="text-gray-700 text-center drop-shadow-sm">
                Create engaging Bible emoji quizzes for your Sunday School class!
              </p>
            </div>

            {error && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Topic *
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  placeholder="e.g., Noah's Ark, Parables of Jesus, Creation Story"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  >
                    {difficulties.map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <select
                    id="numQuestions"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  >
                    {questionCounts.map((count) => (
                      <option key={count} value={count}>
                        {count} Questions
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Quiz...
                  </>
                ) : (
                  '✨ Generate Emoji Quiz'
                )}
              </button>
            </form>
          </div>

          {generatedQuiz && (
            <div className="mt-8">
              <QuizDisplay quiz={generatedQuiz} />
            </div>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  );
}