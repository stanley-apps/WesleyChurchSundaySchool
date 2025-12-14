/// <reference types="vite/client" />
/// <reference lib="dom.speechrecognition" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Extend the Window interface to include SpeechRecognition and webkitSpeechRecognition constructors
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

// The types SpeechRecognition, SpeechRecognitionEvent, and SpeechRecognitionErrorEvent
// are provided by the 'dom.speechrecognition' lib reference.