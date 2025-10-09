import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useNotification } from '../contexts/AuthContext';
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';

export function QuizGenerator() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const difficulties = ['easy', 'medium', 'hard', 'extreme'];
  const questionCounts = [5, 10, 15, 20];
  const allowedFileTypes = [
    'application/pdf', 
    'text/plain', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!allowedFileTypes.includes(file.type)) {
        setError('Only PDF, TXT, or PPTX files are allowed.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to generate quizzes.');
      showNotification('You must be logged in to generate quizzes.', 'error');
      return;
    }

    if (!topic.trim() && !selectedFile) {
      setError('Please enter a quiz topic OR upload a file.');
      showNotification('Please enter a quiz topic OR upload a file.', 'error');
      return;
    }

    setLoading(true);

    let fileUrl: string | null = null;
    let fileType: string | null = null;

    try {
      if (selectedFile) {
        const bucketName = 'quiz_source_files';
        const fileExtension = selectedFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uploadData.path);
        
        if (!publicUrlData.publicUrl) {
          throw new Error('Failed to get public URL for the uploaded file.');
        }
        fileUrl = publicUrlData.publicUrl;
        fileType = selectedFile.type;
      }

      const { data, error: edgeFunctionError } = await supabase.functions.invoke('quiz-generator', {
        body: JSON.stringify({ 
          quizTopic: topic.trim(), // Changed to quizTopic
          difficulty, 
          numQuestions,
          fileUrl,
          fileType
        }),
      });

      if (edgeFunctionError) {
        throw edgeFunctionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      showNotification('Quiz generated successfully! 🎉', 'success');
      navigate(`/dashboard/quizzes/${data.quizId}`);
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
              to="/dashboard/games"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Games
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
                AI Quiz Generator 🎮
              </h1>
              <p className="text-gray-700 text-center drop-shadow-sm">
                Create engaging Bible quizzes from a topic or an uploaded document!
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
                  Quiz Topic (e.g., Noah's Ark, Parables of Jesus)
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  placeholder="Enter the quiz topic..."
                />
              </div>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div>
                <label htmlFor="quizFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Document (PDF, TXT, PPTX)
                </label>
                <input
                  type="file"
                  id="quizFile"
                  accept={allowedFileTypes.join(',')}
                  onChange={handleFileChange}
                  className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">Selected file: {selectedFile.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Note: For PDF and PPTX files, the AI will attempt to read content from the provided URL. Direct parsing of these formats within the Edge Function is not supported in this version.
                </p>
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
                  '✨ Generate Quiz'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  );
}