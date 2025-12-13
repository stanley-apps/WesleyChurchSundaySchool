/// <reference types="vite/client" />
/// <reference lib="dom.speechrecognition" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Explicitly declare global types for SpeechRecognition API
// This ensures they are recognized even if the lib reference is flaky
declare const SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

declare const webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

declare const SpeechRecognitionEvent: {
    prototype: SpeechRecognitionEvent;
    new(type: string, eventInitDict?: SpeechRecognitionEventInit): SpeechRecognitionEvent;
};

declare const SpeechRecognitionErrorEvent: {
    prototype: SpeechRecognitionErrorEvent;
    new(type: string, eventInitDict?: SpeechRecognitionErrorEventInit): SpeechRecognitionErrorEvent;
};