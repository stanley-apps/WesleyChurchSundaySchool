import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth, useNotification } from '../contexts/AuthContext';
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';

type LocalQuizQuestion = {
  id: string;
  question: string;
  emoji_question?: string;
  options: string[];
  answer_index: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extremely Hard';
  topic: string;
  source_reference?: string;
};

const localQuestionBank: Record<string, Omit<LocalQuizQuestion, 'id' | 'difficulty' | 'topic'>[]> = {
  creation: [
    {
      question: 'What did God create on the first day?',
      options: ['Light', 'Birds', 'People', 'Fish'],
      answer_index: 0,
      explanation: 'God said, "Let there be light," and there was light.',
      source_reference: 'Genesis 1:3',
    },
    {
      question: 'On which day did God rest?',
      options: ['Third day', 'Fifth day', 'Seventh day', 'First day'],
      answer_index: 2,
      explanation: 'God rested on the seventh day after finishing creation.',
      source_reference: 'Genesis 2:2',
    },
    {
      question: 'Who were the first people God made?',
      options: ['Noah and Sarah', 'Adam and Eve', 'Moses and Miriam', 'David and Ruth'],
      answer_index: 1,
      explanation: 'Adam and Eve were the first man and woman in Genesis.',
      source_reference: 'Genesis 2:7, 2:22',
    },
  ],
  noah: [
    {
      question: 'What did God tell Noah to build?',
      options: ['A tower', 'A temple', 'An ark', 'A palace'],
      answer_index: 2,
      explanation: 'God told Noah to build an ark before the flood.',
      source_reference: 'Genesis 6:14',
    },
    {
      question: 'What sign did God place in the sky after the flood?',
      options: ['A star', 'A rainbow', 'A cloud', 'A flame'],
      answer_index: 1,
      explanation: 'The rainbow was a sign of God\'s covenant.',
      source_reference: 'Genesis 9:13',
    },
    {
      question: 'Who went into the ark with Noah?',
      options: ['Only Noah', 'Noah and his family', 'All the kings', 'Only the priests'],
      answer_index: 1,
      explanation: 'Noah, his family, and the animals entered the ark.',
      source_reference: 'Genesis 7:7',
    },
  ],
  moses: [
    {
      question: 'Where did God speak to Moses from a burning bush?',
      options: ['Egypt', 'Mount Sinai', 'Bethlehem', 'Jericho'],
      answer_index: 1,
      explanation: 'God called Moses from the burning bush near Mount Sinai.',
      source_reference: 'Exodus 3:1-4',
    },
    {
      question: 'What sea did God divide for the Israelites?',
      options: ['Red Sea', 'Dead Sea', 'Sea of Galilee', 'Mediterranean Sea'],
      answer_index: 0,
      explanation: 'God parted the Red Sea so the Israelites could cross.',
      source_reference: 'Exodus 14:21-22',
    },
    {
      question: 'What did God give Moses on stone tablets?',
      options: ['A map', 'The Ten Commandments', 'A song', 'A crown'],
      answer_index: 1,
      explanation: 'God gave Moses the Ten Commandments.',
      source_reference: 'Exodus 31:18',
    },
  ],
  'david and goliath': [
    {
      question: 'What giant did David face?',
      options: ['Pharaoh', 'Goliath', 'Samson', 'Saul'],
      answer_index: 1,
      explanation: 'David trusted God and faced Goliath.',
      source_reference: '1 Samuel 17',
    },
    {
      question: 'What did David use against Goliath?',
      options: ['A sling and stone', 'A spear', 'A chariot', 'A bow'],
      answer_index: 0,
      explanation: 'David used a sling and a stone to defeat Goliath.',
      source_reference: '1 Samuel 17:49',
    },
    {
      question: 'Why was David brave?',
      options: ['He was the tallest', 'He trusted God', 'He had armor', 'He was a king already'],
      answer_index: 1,
      explanation: 'David believed the Lord would help him.',
      source_reference: '1 Samuel 17:37',
    },
  ],
  daniel: [
    {
      question: 'Where was Daniel thrown for praying to God?',
      options: ['A well', 'A prison', 'A lions\' den', 'A boat'],
      answer_index: 2,
      explanation: 'Daniel was thrown into the lions\' den, but God protected him.',
      source_reference: 'Daniel 6',
    },
    {
      question: 'How many times did Daniel pray each day?',
      options: ['One time', 'Two times', 'Three times', 'Seven times'],
      answer_index: 2,
      explanation: 'Daniel continued praying three times a day.',
      source_reference: 'Daniel 6:10',
    },
    {
      question: 'Who shut the lions\' mouths?',
      options: ['The king', 'Daniel', 'God\'s angel', 'The guards'],
      answer_index: 2,
      explanation: 'God sent His angel to shut the lions\' mouths.',
      source_reference: 'Daniel 6:22',
    },
  ],
  jonah: [
    {
      question: 'Where did God tell Jonah to go?',
      options: ['Nineveh', 'Bethlehem', 'Jerusalem', 'Egypt'],
      answer_index: 0,
      explanation: 'God told Jonah to go to Nineveh.',
      source_reference: 'Jonah 1:2',
    },
    {
      question: 'What swallowed Jonah?',
      options: ['A lion', 'A great fish', 'A camel', 'A bird'],
      answer_index: 1,
      explanation: 'The Lord provided a great fish to swallow Jonah.',
      source_reference: 'Jonah 1:17',
    },
    {
      question: 'What did the people of Nineveh do after Jonah preached?',
      options: ['Ignored him', 'Moved away', 'Repented', 'Built a boat'],
      answer_index: 2,
      explanation: 'The people believed God and turned from evil.',
      source_reference: 'Jonah 3:5-10',
    },
  ],
  "jesus' miracles": [
    {
      question: 'What did Jesus turn water into at Cana?',
      options: ['Milk', 'Honey', 'Wine', 'Oil'],
      answer_index: 2,
      explanation: 'Jesus turned water into wine at a wedding in Cana.',
      source_reference: 'John 2:1-11',
    },
    {
      question: 'How many people did Jesus feed with five loaves and two fish?',
      options: ['50', '500', '5,000', '50,000'],
      answer_index: 2,
      explanation: 'Jesus fed about five thousand men, plus women and children.',
      source_reference: 'Matthew 14:13-21',
    },
    {
      question: 'What did Jesus do during a storm on the sea?',
      options: ['Slept only', 'Calmed the storm', 'Left the boat', 'Built a raft'],
      answer_index: 1,
      explanation: 'Jesus rebuked the wind and waves, and it became calm.',
      source_reference: 'Mark 4:39',
    },
  ],
  'parables of jesus': [
    {
      question: 'Who helped the hurt man in the Good Samaritan?',
      options: ['A Samaritan', 'A soldier', 'A fisherman', 'A tax collector'],
      answer_index: 0,
      explanation: 'The Samaritan showed mercy to the hurt man.',
      source_reference: 'Luke 10:33-37',
    },
    {
      question: 'In the Prodigal Son, who welcomed the son home?',
      options: ['His brother', 'His father', 'A servant', 'A neighbor'],
      answer_index: 1,
      explanation: 'The father welcomed his son with love and forgiveness.',
      source_reference: 'Luke 15:20-24',
    },
    {
      question: 'What did the wise builder build his house on?',
      options: ['Sand', 'Grass', 'Rock', 'Clay'],
      answer_index: 2,
      explanation: 'Jesus said the wise builder built on rock.',
      source_reference: 'Matthew 7:24-25',
    },
  ],
  easter: [
    {
      question: 'What happened on Easter morning?',
      options: ['Jesus was born', 'Jesus rose from the dead', 'Moses crossed the sea', 'David became king'],
      answer_index: 1,
      explanation: 'Christians celebrate Jesus rising from the dead on Easter.',
      source_reference: 'Matthew 28:5-6',
    },
    {
      question: 'Who first found the empty tomb?',
      options: ['The women followers', 'King Herod', 'The shepherds', 'Pharaoh'],
      answer_index: 0,
      explanation: 'Women who followed Jesus came to the tomb and found it empty.',
      source_reference: 'Luke 24:1-3',
    },
    {
      question: 'What did the angel say about Jesus?',
      options: ['He is hiding', 'He is risen', 'He is sleeping', 'He is traveling'],
      answer_index: 1,
      explanation: 'The angel told them Jesus had risen.',
      source_reference: 'Matthew 28:6',
    },
  ],
  christmas: [
    {
      question: 'Where was Jesus born?',
      options: ['Nazareth', 'Bethlehem', 'Jerusalem', 'Nineveh'],
      answer_index: 1,
      explanation: 'Jesus was born in Bethlehem.',
      source_reference: 'Luke 2:4-7',
    },
    {
      question: 'Who announced Jesus\' birth to the shepherds?',
      options: ['An angel', 'A king', 'A fisherman', 'A soldier'],
      answer_index: 0,
      explanation: 'An angel announced the good news to the shepherds.',
      source_reference: 'Luke 2:8-12',
    },
    {
      question: 'What gift did the wise men bring besides frankincense and myrrh?',
      options: ['Silver', 'Gold', 'Bread', 'Oil'],
      answer_index: 1,
      explanation: 'The wise men brought gold, frankincense, and myrrh.',
      source_reference: 'Matthew 2:11',
    },
  ],
  'books of the bible': [
    {
      question: 'What is the first book of the Bible?',
      options: ['Exodus', 'Genesis', 'Matthew', 'Psalms'],
      answer_index: 1,
      explanation: 'Genesis is the first book of the Bible.',
      source_reference: 'Genesis',
    },
    {
      question: 'What is the first book of the New Testament?',
      options: ['Matthew', 'Mark', 'Luke', 'John'],
      answer_index: 0,
      explanation: 'Matthew begins the New Testament.',
      source_reference: 'Matthew',
    },
    {
      question: 'Which book is known for many songs and prayers?',
      options: ['Psalms', 'Ruth', 'Acts', 'Jonah'],
      answer_index: 0,
      explanation: 'Psalms contains many songs, prayers, and praises.',
      source_reference: 'Psalms',
    },
  ],
};

const difficultyLabels: Record<string, LocalQuizQuestion['difficulty']> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  extreme: 'Extremely Hard',
};

const getEdgeFunctionMessage = async (error: any) => {
  const context = error?.context;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      if (payload?.error) return payload.error;
    } catch (_) {
      try {
        const text = await context.clone().text();
        if (text) return text;
      } catch (_) {}
    }
    return `Edge Function failed with status ${context.status}`;
  }
  return error?.message || 'Failed to send a request to the Edge Function';
};

type QuestionMode = 'regular' | 'emoji';

const emojiFallbacks: Record<string, string[]> = {
  creation: ['💡 🌍 🌱 ☀️', '🌍 ✅ 😴 7️⃣', '👨 👩 🌿'],
  noah: ['👨 🔨 🚢 🌧️', '🌈 🤝 🙏', '👨 👩 🐘 🦒 🚢'],
  moses: ['🔥 🌳 👂 🙏', '🌊 ➡️ 🚶 🙌', '🪨 ✍️ 🔟'],
  'david and goliath': ['👦 🪨 🧍‍♂️ 💪', '🪨 🌀 🎯', '🙏 💪 👦'],
  daniel: ['🙏 🦁 🕳️', '🙏 3️⃣ ☀️', '😇 🦁 🤐'],
  jonah: ['🏙️ 📣 🙏', '🌊 🐟 🙏', '🏙️ 😢 🙏 ✅'],
  "jesus' miracles": ['💧 ➡️ 🍷', '🍞 🐟 👥', '🌊 ⛈️ ✋'],
  'parables of jesus': ['🤕 🛣️ ❤️', '🏠 👨‍👦 ❤️', '🏠 🪨 🌧️'],
  easter: ['✝️ 🪦 ✨', '👩‍🦱 👩 🪦', '😇 🪦 🙌'],
  christmas: ['👶 🌟 🏠', '😇 🐑 📣', '👑 🎁 🌟'],
  'books of the bible': ['📖 1️⃣ 🌍', '📖 ✝️ 1️⃣', '🎵 🙏 📖'],
};

const withBibleVersion = (reference?: string) => {
  if (!reference) return 'NIV/ESV';
  return /NIV|ESV/i.test(reference) ? reference : `${reference} NIV/ESV`;
};

const buildLocalQuizQuestions = (topic: string, difficulty: string, numQuestions: number, questionMode: QuestionMode): LocalQuizQuestion[] => {
  const normalizedTopic = topic.trim().toLowerCase();
  const baseQuestions = localQuestionBank[normalizedTopic] || localQuestionBank['books of the bible'];
  const selectedQuestions = baseQuestions.slice(0, numQuestions);
  const emojiQuestions = emojiFallbacks[normalizedTopic] || emojiFallbacks['books of the bible'];

  return selectedQuestions.map((question, index) => ({
    ...question,
    id: `local-${Date.now()}-${index + 1}`,
    question: questionMode === 'emoji' ? emojiQuestions[index] || question.question : question.question,
    difficulty: difficultyLabels[difficulty] || 'Easy',
    topic: topic.trim() || 'Bible Quiz',
    source_reference: withBibleVersion(question.source_reference),
  }));
};

export function QuizGenerator() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionMode, setQuestionMode] = useState<QuestionMode>('regular');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const difficulties = ['easy', 'medium', 'hard', 'extreme'];
  const questionCounts = [5, 10, 15, 20];
  const topicPresets = [
    'Creation',
    'Noah',
    'Moses',
    'David and Goliath',
    'Daniel',
    'Jonah',
    "Jesus' Miracles",
    'Parables of Jesus',
    'Easter',
    'Christmas',
    'Books of the Bible',
  ];
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
          questionMode,
          fileUrl,
          fileType
        }),
      });

      if (edgeFunctionError) {
        throw new Error(await getEdgeFunctionMessage(edgeFunctionError));
      }

      if (data.error) {
        throw new Error(data.error);
      }

      showNotification('Quiz generated successfully! 🎉', 'success');
      navigate(`/dashboard/quizzes/${data.quizId}/play`);
    } catch (err: any) {
      console.error('Error generating quiz:', err);
      const edgeFunctionMessage = err.message || 'Failed to generate quiz. Please try again.';

      if (selectedFile) {
        setError(`${edgeFunctionMessage} Uploaded-file quizzes require the Supabase Edge Function to be deployed and configured.`);
        showNotification('Error generating quiz: ' + edgeFunctionMessage, 'error');
        return;
      }

      try {
        const fallbackQuestions = buildLocalQuizQuestions(topic, difficulty, numQuestions, questionMode);
        const { data: localQuiz, error: insertError } = await supabase
          .from('quizzes')
          .insert({
            user_id: user.id,
            topic: topic.trim(),
            difficulty,
            num_questions: fallbackQuestions.length,
            questions: fallbackQuestions,
            status: 'draft',
            ai_model_used: 'Local fallback',
            generation_metadata: {
              aiModel: 'Local fallback',
              generationTime: Date.now(),
              validationScore: 1,
              questionMode,
            },
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        const localNotice = fallbackQuestions.length < numQuestions
          ? `Quiz generated locally with ${fallbackQuestions.length} unique questions.`
          : 'Quiz generated locally because the Edge Function is unavailable.';
        showNotification(localNotice, 'success');
        navigate(`/dashboard/quizzes/${localQuiz.id}/play`);
      } catch (fallbackError: any) {
        console.error('Error generating fallback quiz:', fallbackError);
        const fallbackMessage = fallbackError.message || edgeFunctionMessage;
        setError(fallbackMessage);
        showNotification('Error generating quiz: ' + fallbackMessage, 'error');
      }
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
                <div className="mt-3 flex flex-wrap gap-2">
                  {topicPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopic(preset)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        topic === preset
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-blue-700 border-blue-100 hover:bg-blue-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
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
                  <label htmlFor="questionMode" className="block text-sm font-medium text-gray-700 mb-2">
                    Question Mode
                  </label>
                  <div id="questionMode" className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
                    {(['regular', 'emoji'] as QuestionMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setQuestionMode(mode)}
                        className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-colors ${
                          questionMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

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

                <div className="sm:col-span-2">
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
