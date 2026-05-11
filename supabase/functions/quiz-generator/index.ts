// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { corsHeaders } from 'shared/cors.ts'

// Get AI API Key from environment variables
let AI_API_KEY: string | undefined = undefined
try {
  AI_API_KEY = Deno.env.get("AI_API_KEY")
} catch (_) {}

// Define the structure for a quiz question (updated)
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extremely Hard';
  topic: string;
  source_reference?: string;
}

// Function to fetch file content from Supabase Storage
async function fetchFileContent(fileUrl: string, fileType: string): Promise<string> {
  if (fileType === 'text/plain') {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch text file from ${fileUrl}: ${response.statusText}`);
    }
    return await response.text();
  } else if (fileType === 'application/pdf' || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    // For PDF and PPTX, we cannot directly parse content in Deno without complex libraries.
    // Instead, we'll instruct the AI to try and read from the URL.
    // This is a best-effort approach and may not always work depending on AI capabilities.
    return `Content from URL: ${fileUrl}`;
  }
  return ''; // Fallback for unsupported types
}

// Function to call a generic AI API
type QuestionMode = 'regular' | 'emoji';

function normalizeDifficulty(difficulty: string): QuizQuestion['difficulty'] {
  const normalized = String(difficulty || 'easy').toLowerCase();
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'hard') return 'Hard';
  if (normalized === 'extreme' || normalized === 'extremely hard') return 'Extremely Hard';
  return 'Easy';
}

function normalizeQuestionText(question: string): string {
  return question.toLowerCase().replace(/[^\p{L}\p{N}\p{Emoji_Presentation}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

function withBibleVersion(reference?: string): string {
  if (!reference) return 'NIV/ESV';
  return /NIV|ESV/i.test(reference) ? reference : `${reference} NIV/ESV`;
}

async function generateQuizWithAI(quizTopic: string, difficulty: string, numQuestions: number, chunks: string | null, questionMode: QuestionMode): Promise<{ questions: QuizQuestion[], aiModel: string }> {
  if (!AI_API_KEY) {
    throw new Error("AI_API_KEY is not set in environment variables.");
  }

  const AI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions"; // Example for OpenAI

  const systemPrompt = `You are a Bible-based quiz creator for Sunday School children under age 17.
You create simple, wholesome, educational quizzes drawn directly from the provided content.
The questions should promote curiosity, moral reflection, and biblical literacy.
Question mode: ${questionMode}.

SAFETY RULES:
- Never include adult, violent, profane, or inappropriate topics.
- Avoid any mention of sexual behavior, politics, or real-world conflicts.
- Use child-safe vocabulary.
- Stick to the Bible passages or Christian moral lessons provided.
- Keep answers factual — don’t invent events or people not in the Bible.

OUTPUT FORMAT: JSON array of question objects.
Each question object must look like this:
{
  "id": "string",
  "question": "${questionMode === 'emoji' ? 'emoji clue only, no words' : 'string'}",
  "options": ["optA","optB","optC","optD"],
  "answer_index": 0,
  "explanation": "short explanation in 1-2 sentences",
  "difficulty": "Easy/Medium/Hard/Extremely Hard",
  "topic": "string",
  "source_reference": "file/slide/page info if any"
}

DIFFICULTY GUIDELINES:
- Easy → direct recall; answer found word-for-word in source
- Medium → requires understanding or reasoning
- Hard → requires cross-linking concepts or comparing people/events
- Extremely Hard → synthesis or symbolic interpretation`;

  const userPrompt = `Create up to ${numQuestions} unique Multiple-Choice Questions from the text below.

Topic: ${quizTopic}
Difficulty: ${normalizeDifficulty(difficulty)}
Source Text:

${chunks || ''}

Each question must:
- Relate to the topic
- Be child-friendly
- Match the selected difficulty exactly: ${normalizeDifficulty(difficulty)}
- Use NIV/ESV as the Bible reference basis
- Set source_reference to a book/chapter/verse plus "NIV/ESV"
- Not repeat the same question, emoji clue, or answer concept
- Include 4 unique, plausible options
- Highlight ONE correct answer index
- Include a short explanation with Bible reference (Book, Chapter, Verse if found)
- Stay under 30 words per regular question
${questionMode === 'emoji' ? '- Put emoji clues only in the question field. Do not include words, punctuation, or labels in the question field.' : '- Put a normal text question in the question field.'}

### FEW-SHOT EXAMPLES:
Example 1:
Question: ${questionMode === 'emoji' ? '👨 🔨 🚢 🌧️' : 'Who built the ark?'}
Options: ["Noah", "Abraham", "Solomon", "Moses"]
Answer: 0
Explanation: Noah built the ark to survive the flood (Genesis 6–9).
Source Reference: Genesis 6-9 NIV/ESV

Example 2:
Question: ${questionMode === 'emoji' ? '👑 😴 💭 🙏' : 'Who interpreted King Nebuchadnezzar’s dream?'}
Options: ["Daniel", "Joseph", "Elijah", "David"]
Answer: 0
Explanation: Daniel explained the king’s dream with God's help (Daniel 2).
Source Reference: Daniel 2 NIV/ESV

### Generate your quiz now as JSON only.`;

  try {
    const response = await fetch(AI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Replace with your desired AI model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("AI API Error Response:", errorBody);
      throw new Error(`AI API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    
    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      throw new Error("AI response did not contain expected content.");
    }

    const parsedResponse = JSON.parse(aiContent);
    const parsedQuestions: QuizQuestion[] = parsedResponse.questions || parsedResponse; // Handle if AI wraps in 'questions' key

    if (!Array.isArray(parsedQuestions)) {
      throw new Error("AI response was not a JSON array of questions.");
    }

    const seenQuestions = new Set<string>();
    const selectedDifficulty = normalizeDifficulty(difficulty);
    const validatedQuestions: QuizQuestion[] = [];

    parsedQuestions.forEach((q: any, index: number) => {
      // Generate a unique ID if not provided by AI
      const questionId = q.id || `q${String(index + 1).padStart(3, '0')}`;

      if (
        typeof q.question !== 'string' || q.question.trim() === '' ||
        !Array.isArray(q.options) || q.options.length !== 4 ||
        typeof q.answer_index !== 'number' || q.answer_index < 0 || q.answer_index > 3 ||
        typeof q.explanation !== 'string' || q.explanation.trim() === '' ||
        typeof q.difficulty !== 'string' || !['Easy', 'Medium', 'Hard', 'Extremely Hard'].includes(q.difficulty) ||
        typeof q.topic !== 'string' || q.topic.trim() === ''
      ) {
        console.warn(`Invalid question structure at index ${index}:`, q);
        return;
      }

      const normalizedQuestion = normalizeQuestionText(q.question);
      const answerConcept = String(q.options[q.answer_index] || '').toLowerCase().trim();
      const dedupeKey = `${normalizedQuestion}|${answerConcept}`;
      if (seenQuestions.has(dedupeKey)) return;
      seenQuestions.add(dedupeKey);

      validatedQuestions.push({
        id: questionId,
        question: q.question.trim(),
        options: q.options,
        answer_index: q.answer_index,
        explanation: q.explanation,
        difficulty: selectedDifficulty,
        topic: q.topic,
        source_reference: withBibleVersion(q.source_reference),
      });
    });

    if (validatedQuestions.length === 0) {
      throw new Error("AI did not return any valid unique quiz questions.");
    }

    return { questions: validatedQuestions, aiModel: data.model || "Unknown AI Model" };

  } catch (error) {
    console.error("Error in AI quiz generation:", error);
    throw new Error(`Failed to generate quiz with AI: ${(error as Error).message}`);
  }
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
    const { quizTopic, difficulty, numQuestions, fileUrl, fileType, questionMode = 'regular' } = await req.json() // Changed topic to quizTopic
    const normalizedQuestionMode: QuestionMode = questionMode === 'emoji' ? 'emoji' : 'regular';

    if (!quizTopic && !fileUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: quizTopic or fileUrl.' }),
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

    let chunks: string | null = null; // Changed fileContent to chunks
    if (fileUrl && fileType) {
      chunks = await fetchFileContent(fileUrl, fileType);
    }

    // Generate quiz using AI
    const { questions: generatedQuestions, aiModel } = await generateQuizWithAI(quizTopic, difficulty, numQuestions, chunks, normalizedQuestionMode); // Changed topic to quizTopic, fileContent to chunks

    // Insert the generated quiz into the 'quizzes' table
    const { data: quiz, error: insertError } = await supabaseClient
      .from('quizzes')
      .insert({
        user_id: user.id,
        topic: quizTopic, // Changed to quizTopic
        difficulty,
        num_questions: generatedQuestions.length,
        questions: generatedQuestions,
        status: 'draft', // Initially set as draft
        ai_model_used: aiModel,
        generation_metadata: {
          aiModel: aiModel,
          generationTime: Date.now(), // Use actual generation time
          validationScore: 1.0, // Assuming perfect validation after parsing
          questionMode: normalizedQuestionMode,
          sourceFileUrl: fileUrl, // Store the source file URL
          sourceFileType: fileType // Store the source file type
        }
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
        generationMetadata: quiz.generation_metadata
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
