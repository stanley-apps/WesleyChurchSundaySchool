import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Quiz } from '../lib/supabase'; // Import Quiz type from supabase.ts
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';
import { QuizDisplay } from '../components/QuizDisplay';
import { useNotification } from '../contexts/AuthContext';

export function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    if (id) {
      fetchQuiz(id);
    }
  }, [id]);

  const fetchQuiz = async (quizId: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) throw error;
      if (!data) {
        setError('Quiz not found.');
        showNotification('Quiz not found.', 'error');
        return;
      }
      setQuiz(data as Quiz);
    } catch (err: any) {
      console.error('Error fetching quiz:', err);
      setError(err.message);
      showNotification('Error fetching quiz: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </ChildFriendlyBackground>
    );
  }

  if (error || !quiz) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error || 'Quiz not found.'}
            </div>
            <Link 
              to="/dashboard/games/bible-quiz" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Quiz Generator
            </Link>
          </div>
        </div>
      </ChildFriendlyBackground>
    );
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard/games/bible-quiz"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Quiz Generator
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
            >
              🏠 Dashboard
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <QuizDisplay quiz={quiz} />
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  );
}
