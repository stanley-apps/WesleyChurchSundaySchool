import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, Quiz, QuizQuestion } from '../lib/supabase';
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';
import { useNotification } from '../contexts/AuthContext';

type PlayMode = 'classroom' | 'solo';

function formatDifficulty(difficulty: string) {
  if (!difficulty) return 'Easy';
  return difficulty
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function isPlayableQuestion(question: QuizQuestion) {
  return (
    typeof question.question === 'string' &&
    question.question.trim().length > 0 &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    Number.isInteger(question.answer_index) &&
    question.answer_index >= 0 &&
    question.answer_index < question.options.length
  );
}

export function QuizPlay() {
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<PlayMode>('classroom');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showEmojiAnswers, setShowEmojiAnswers] = useState(false);
  const [score, setScore] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState<QuizQuestion[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });

  useEffect(() => {
    if (id) {
      fetchQuiz(id);
    }
  }, [id]);

  const playableQuestions = useMemo(() => {
    return quiz?.questions?.filter(isPlayableQuestion) || [];
  }, [quiz]);

  const currentQuestion = playableQuestions[currentIndex];
  const hasAnswered = selectedAnswer !== null;
  const isEmojiQuiz = quiz?.generation_metadata?.questionMode === 'emoji';
  const shouldShowAnswers = !isEmojiQuiz || showEmojiAnswers || hasAnswered;
  const percent = playableQuestions.length > 0 ? Math.round((score / playableQuestions.length) * 100) : 0;

  const fetchQuiz = async (quizId: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (fetchError) throw fetchError;
      setQuiz(data as Quiz);
    } catch (err: any) {
      console.error('Error fetching quiz:', err);
      setError(err.message || 'Failed to load quiz.');
      showNotification('Error loading quiz: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetPlay = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowEmojiAnswers(false);
    setScore(0);
    setMissedQuestions([]);
    setIsFinished(false);
    setTeamScores({ teamA: 0, teamB: 0 });
  };

  const handleAnswer = (answerIndex: number) => {
    if (!currentQuestion || hasAnswered) return;

    setSelectedAnswer(answerIndex);
    if (answerIndex === currentQuestion.answer_index) {
      setScore((currentScore) => currentScore + 1);
    } else {
      setMissedQuestions((current) => [...current, currentQuestion]);
    }
  };

  const goToNextQuestion = () => {
    if (currentIndex >= playableQuestions.length - 1) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedAnswer(null);
    setShowEmojiAnswers(false);
  };

  const addTeamPoint = (team: 'teamA' | 'teamB') => {
    setTeamScores((current) => ({
      ...current,
      [team]: current[team] + 1,
    }));
  };

  if (loading) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
            <div className="bg-red-50/90 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error || 'Quiz not found.'}
            </div>
            <Link to="/dashboard/games" className="text-blue-600 hover:underline font-medium">
              Back to Games
            </Link>
          </div>
        </div>
      </ChildFriendlyBackground>
    );
  }

  if (playableQuestions.length === 0) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto bg-white/90 rounded-xl border border-white/50 shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Quiz cannot be played</h1>
            <p className="text-gray-700 mb-6">This quiz does not have playable multiple-choice questions.</p>
            <Link to={`/dashboard/quizzes/${quiz.id}`} className="text-blue-600 hover:underline font-medium">
              Review Answers
            </Link>
          </div>
        </div>
      </ChildFriendlyBackground>
    );
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-4 sm:p-6 pb-20 lg:pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link to="/dashboard/games" className="text-blue-600 hover:underline font-medium">
              ⬅️ Back to Games
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link to={`/dashboard/quizzes/${quiz.id}`} className="text-blue-600 hover:underline font-medium">
                Review Answers
              </Link>
              <button onClick={resetPlay} className="text-blue-600 hover:underline font-medium">
                Play Again
              </button>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-5 sm:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{quiz.topic} Quiz</h1>
                <p className="mt-1 text-gray-600">
                  {formatDifficulty(quiz.difficulty)} • {playableQuestions.length} questions
                  {isEmojiQuiz ? ' • Emoji mode' : ''}
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 self-start">
                {(['classroom', 'solo'] as PlayMode[]).map((playMode) => (
                  <button
                    key={playMode}
                    onClick={() => setMode(playMode)}
                    className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-colors ${
                      mode === playMode ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-white'
                    }`}
                  >
                    {playMode}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'classroom' && (
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 flex items-center justify-between">
                  <span className="font-bold text-blue-900">Team A: {teamScores.teamA}</span>
                  <button onClick={() => addTeamPoint('teamA')} className="px-3 py-1 rounded-md bg-blue-600 text-white font-bold">
                    +1
                  </button>
                </div>
                <div className="rounded-lg border border-green-100 bg-green-50 p-4 flex items-center justify-between">
                  <span className="font-bold text-green-900">Team B: {teamScores.teamB}</span>
                  <button onClick={() => addTeamPoint('teamB')} className="px-3 py-1 rounded-md bg-green-600 text-white font-bold">
                    +1
                  </button>
                </div>
              </div>
            )}

            {isFinished ? (
              <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete</h2>
                <p className="text-xl text-gray-700 mb-6">
                  Score: {score}/{playableQuestions.length} ({percent}%)
                </p>
                {mode === 'classroom' && (
                  <p className="text-lg text-gray-700 mb-6">
                    Team A: {teamScores.teamA} • Team B: {teamScores.teamB}
                  </p>
                )}
                {missedQuestions.length > 0 && (
                  <div className="text-left bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                    <h3 className="font-bold text-red-900 mb-3">Review Missed Questions</h3>
                    <div className="space-y-3">
                      {missedQuestions.map((question) => (
                        <div key={question.id} className="text-sm text-red-900">
                          <p className="font-semibold">{question.question}</p>
                          <p>Answer: {question.options[question.answer_index]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={resetPlay} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg">
                    Play Again
                  </button>
                  <Link to={`/dashboard/quizzes/${quiz.id}`} className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-3 rounded-lg">
                    Review Answers
                  </Link>
                  <Link to="/dashboard/games" className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-3 rounded-lg">
                    Back to Games
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-5 flex items-center justify-between text-sm font-bold text-gray-600">
                  <span>Question {currentIndex + 1} of {playableQuestions.length}</span>
                  <span>Score {score}</span>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 sm:p-8 mb-6">
                  <h2 className={`${isEmojiQuiz ? 'text-5xl sm:text-7xl tracking-normal' : 'text-2xl sm:text-4xl'} font-bold text-gray-900 leading-tight text-center`}>
                    {currentQuestion.question}
                  </h2>
                </div>
                {isEmojiQuiz && !shouldShowAnswers && (
                  <div className="mb-6 text-center">
                    <button
                      onClick={() => setShowEmojiAnswers(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg"
                    >
                      Show Answers
                    </button>
                  </div>
                )}
                {shouldShowAnswers && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === currentQuestion.answer_index;
                    const isSelected = optionIndex === selectedAnswer;
                    const revealClass = hasAnswered
                      ? isCorrect
                        ? 'bg-green-100 border-green-400 text-green-900'
                        : isSelected
                          ? 'bg-red-100 border-red-400 text-red-900'
                          : 'bg-white border-gray-200 text-gray-700'
                      : 'bg-white border-blue-100 text-gray-900 hover:bg-blue-50 hover:border-blue-300';

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswer(optionIndex)}
                        disabled={hasAnswered}
                        className={`min-h-[92px] rounded-xl border-2 p-4 text-left text-lg sm:text-xl font-bold transition-colors ${revealClass}`}
                      >
                        <span className="mr-3 text-sm text-gray-500">{String.fromCharCode(65 + optionIndex)}.</span>
                        {option}
                      </button>
                    );
                  })}
                </div>
                )}
                {hasAnswered && (
                  <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <p className="font-bold text-gray-900">
                      Correct answer: {currentQuestion.options[currentQuestion.answer_index]}
                    </p>
                    {currentQuestion.explanation && (
                      <p className="mt-2 text-gray-700">{currentQuestion.explanation}</p>
                    )}
                    {currentQuestion.source_reference && (
                      <p className="mt-2 text-sm text-gray-600">
                        Source: {currentQuestion.source_reference}
                      </p>
                    )}
                    <button
                      onClick={goToNextQuestion}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg"
                    >
                      {currentIndex >= playableQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  );
}
