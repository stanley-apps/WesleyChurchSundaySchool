// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { corsHeaders } from 'shared/cors.ts' // Corrected import path

// Get AI API Key from environment variables
let AI_API_KEY: string | undefined = undefined
try {
  AI_API_KEY = Deno.env.get("AI_API_KEY")
} catch (_) {}

// Define the structure for a quiz question
interface QuizQuestion {
  emojis: string[];
  choices: string[];
  correctIndex: number;
  bibleReference: string;
  hint?: string;
  explanation: string;
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
async function generateQuizWithAI(topic: string, difficulty: string, numQuestions: number, fileContent: string | null, fileType: string | null): Promise<{ questions: QuizQuestion[], aiModel: string }> {
  if (!AI_API_KEY) {
    throw new Error("AI_API_KEY is not set in environment variables.");
  }

  const AI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions"; // Example for OpenAI

  let contentPrompt = '';
  if (fileContent) {
    if (fileType === 'text/plain') {
      contentPrompt = `Here is the document content to base the quiz on:\n\n\`\`\`\n${fileContent}\n\`\`\`\n\n`;
    } else if (fileType === 'application/pdf' || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      contentPrompt = `Please generate the quiz based on the content found at this URL: ${fileContent}. `;
    }
  }

  const prompt = `Generate a Bible emoji quiz about "${topic}" with ${numQuestions} questions at a ${difficulty} difficulty level. ${contentPrompt}
Each question should have 2-5 child-friendly emojis, 4 multiple-choice answers, the correct answer index (0-3), a Bible reference, an optional hint, and a brief explanation. Respond only with a JSON array of questions.

Example format for one question:
{
  "emojis": ["🐑", "👨‍🌾", "➡️", "🏠"],
  "choices": ["The Lost Sheep", "The Prodigal Son", "The Good Samaritan", "The Sower"],
  "correctIndex": 0,
  "bibleReference": "Luke 15:3-7",
  "hint": "One of a hundred.",
  "explanation": "A shepherd leaves 99 sheep to find one lost sheep."
}

Ensure the JSON is valid and contains exactly ${numQuestions} questions. Prioritize child-friendly and diverse emojis.`;

  try {
    const response = await fetch(AI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Replace with your desired AI model
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // Request JSON object if supported
        temperature: 0.7,
        max_tokens: 2000, // Adjust based on expected response size
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

    const parsedQuestions = JSON.parse(aiContent);

    if (!Array.isArray(parsedQuestions)) {
      throw new Error("AI response was not a JSON array of questions.");
    }

    const validatedQuestions: QuizQuestion[] = parsedQuestions.map((q: any, index: number) => {
      if (
        !Array.isArray(q.emojis) || q.emojis.length < 2 || q.emojis.length > 5 ||
        !Array.isArray(q.choices) || q.choices.length !== 4 ||
        typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3 ||
        typeof q.bibleReference !== 'string' || q.bibleReference.trim() === '' ||
        typeof q.explanation !== 'string' || q.explanation.trim() === ''
      ) {
        console.warn(`Invalid question structure at index ${index}:`, q);
        throw new Error(`AI generated an invalid question structure at index ${index}.`);
      }
      return {
        emojis: q.emojis,
        choices: q.choices,
        correctIndex: q.correctIndex,
        bibleReference: q.bibleReference,
        hint: q.hint || undefined,
        explanation: q.explanation,
      };
    });

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
    const { topic, difficulty, numQuestions, fileUrl, fileType } = await req.json()

    if (!topic && !fileUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: topic or fileUrl.' }),
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

    let fileContent: string | null = null;
    if (fileUrl && fileType) {
      fileContent = await fetchFileContent(fileUrl, fileType);
    }

    // Generate quiz using AI
    const { questions: generatedQuestions, aiModel } = await generateQuizWithAI(topic, difficulty, numQuestions, fileContent, fileType);

    // Insert the generated quiz into the 'quizzes' table
    const { data: quiz, error: insertError } = await supabaseClient
      .from('quizzes')
      .insert({
        user_id: user.id,
        topic,
        difficulty,
        num_questions: numQuestions,
        questions: generatedQuestions,
        status: 'draft', // Initially set as draft
        ai_model_used: aiModel,
        generation_metadata: {
          aiModel: aiModel,
          generationTime: Date.now(), // Use actual generation time
          validationScore: 1.0, // Assuming perfect validation after parsing
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