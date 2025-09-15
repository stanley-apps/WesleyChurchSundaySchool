// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { corsHeaders } from './cors.ts' // Changed to local relative import

// Mock AI response based on difficulty and topic
function generateMockQuiz(topic: string, difficulty: string, numQuestions: number) {
  const questions = [];
  const baseQuestions = {
    easy: [
      {
        emojis: ["👶🏻", "🐑", "🌟"],
        choices: ["Baby Jesus", "Moses in a basket", "David the shepherd", "Joseph's coat"],
        correctIndex: 0,
        bibleReference: "Luke 2:7",
        hint: "Born in a manger.",
        explanation: "Emojis represent baby Jesus, shepherds, and the star of Bethlehem."
      },
      {
        emojis: ["🦁", "👨‍⚖️", "🚫"],
        choices: ["Daniel in the lions' den", "Samson and the lion", "David and Goliath", "Jonah and the whale"],
        correctIndex: 0,
        bibleReference: "Daniel 6:1-28",
        hint: "A prophet who prayed three times a day.",
        explanation: "Emojis represent a lion, a judge (Daniel), and no harm."
      },
      {
        emojis: ["🌈", "🌧️", "⛵"],
        choices: ["Noah's Ark", "Jonah and the storm", "Jesus calms the storm", "Moses parts the Red Sea"],
        correctIndex: 0,
        bibleReference: "Genesis 6:9-22",
        hint: "A promise after a great flood.",
        explanation: "Emojis represent a rainbow, rain, and a boat (ark)."
      }
    ],
    medium: [
      {
        emojis: ["🍞", "🐟", "✖️5️⃣", "👨‍👩‍👧‍👦"],
        choices: ["Feeding the 5000", "Last Supper", "Wedding at Cana", "Manna from heaven"],
        correctIndex: 0,
        bibleReference: "Matthew 14:13-21",
        hint: "A small meal for a large crowd.",
        explanation: "Emojis represent bread, fish, multiplication, and a family (crowd)."
      },
      {
        emojis: ["🌟", "👑", "🐪", "👶🏻"],
        choices: ["Wise Men visit Jesus", "King David", "Queen Esther", "Joseph's dream"],
        correctIndex: 0,
        bibleReference: "Matthew 2:1-12",
        hint: "They followed a star.",
        explanation: "Emojis represent a star, kings (wise men), camels, and baby Jesus."
      }
    ],
    hard: [
      {
        emojis: ["🔥", "🌬️", "🗣️", "🌍"],
        choices: ["Pentecost", "Burning Bush", "Tower of Babel", "Elijah and the prophets of Baal"],
        correctIndex: 0,
        bibleReference: "Acts 2:1-4",
        hint: "The Holy Spirit descended.",
        explanation: "Emojis represent fire, wind, speaking in tongues, and the world (different languages)."
      },
      {
        emojis: ["🌊", "➡️", "🏜️", "🚶‍♂️"],
        choices: ["Exodus (Red Sea crossing)", "Jonah's journey", "Jesus walks on water", "Paul's shipwreck"],
        correctIndex: 0,
        bibleReference: "Exodus 14:21-22",
        hint: "A great escape from Egypt.",
        explanation: "Emojis represent water, an arrow, a desert, and walking (journey)."
      }
    ],
    extreme: [
      {
        emojis: ["🌱", "➡️", "🌳", "🐦", "☁️"],
        choices: ["Parable of the Mustard Seed", "Tree of Life", "Noah's dove", "Garden of Eden"],
        correctIndex: 0,
        bibleReference: "Matthew 13:31-32",
        hint: "Small beginnings, great growth.",
        explanation: "Emojis represent a small seed, growing into a large tree, where birds nest, reaching for the sky."
      }
    ]
  };

  const availableQuestions = baseQuestions[difficulty as keyof typeof baseQuestions] || baseQuestions.easy;
  
  // Filter questions by topic if possible (mock implementation)
  const relevantQuestions = availableQuestions.filter(q => 
    q.explanation.toLowerCase().includes(topic.toLowerCase()) || 
    q.hint.toLowerCase().includes(topic.toLowerCase()) ||
    q.bibleReference.toLowerCase().includes(topic.toLowerCase())
  );

  // If no relevant questions, use general ones
  const questionsToUse = relevantQuestions.length > 0 ? relevantQuestions : availableQuestions;

  // Select a random subset of questions
  for (let i = 0; i < numQuestions; i++) {
    const randomIndex = Math.floor(Math.random() * questionsToUse.length);
    questions.push(questionsToUse[randomIndex]);
  }

  return {
    questions: questions.slice(0, numQuestions), // Ensure exact number of questions
    generationMetadata: {
      aiModel: "Mock AI",
      generationTime: Math.floor(Math.random() * 1000) + 500, // 0.5 to 1.5 seconds
      validationScore: 1.0 // Mock perfect validation
    }
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  try {
    const { topic, difficulty, numQuestions } = await req.json()

    if (!topic || !difficulty || !numQuestions) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: topic, difficulty, numQuestions.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user from JWT
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User not found.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Simulate AI generation
    const generatedQuizData = generateMockQuiz(topic, difficulty, numQuestions);

    // Perform basic validation on the generated quiz structure
    if (!generatedQuizData.questions || !Array.isArray(generatedQuizData.questions) || generatedQuizData.questions.length === 0) {
      throw new Error('AI generation failed: No questions returned.');
    }
    
    for (const q of generatedQuizData.questions) {
      if (!q.emojis || q.emojis.length < 2 || q.emojis.length > 5 || !q.choices || q.choices.length !== 4 || q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex > 3 || !q.bibleReference || !q.explanation) {
        throw new Error('AI generation failed: Invalid question structure detected.');
      }
    }

    // Insert the generated quiz into the 'quizzes' table
    const { data: quiz, error: insertError } = await supabaseClient
      .from('quizzes')
      .insert({
        user_id: user.id,
        topic,
        difficulty,
        num_questions: numQuestions,
        questions: generatedQuizData.questions,
        status: 'draft', // Initially set as draft
        ai_model_used: generatedQuizData.generationMetadata.aiModel,
        generation_metadata: generatedQuizData.generationMetadata
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting quiz:', insertError);
      throw new Error('Failed to save generated quiz.');
    }

    return new Response(
      JSON.stringify({
        quizId: quiz.id,
        quiz: quiz,
        generationMetadata: generatedQuizData.generationMetadata
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Quiz Generator Edge Function Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Failed to generate quiz. Please try again later.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})