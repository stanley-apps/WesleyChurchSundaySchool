# AI Development Rules for Wesley Church Sunday School Hub

This document outlines the core technologies and preferred libraries to maintain consistency and best practices within the application.

## Tech Stack Overview

*   **Frontend Framework**: React.js for building interactive user interfaces.
*   **Language**: TypeScript for type safety and improved code quality.
*   **Routing**: React Router DOM for client-side navigation.
*   **Styling**: Tailwind CSS for utility-first styling, ensuring responsive and consistent designs.
*   **UI Components**: Shadcn/ui for pre-built, accessible, and customizable UI components.
*   **Backend & Authentication**: Supabase for database, authentication, and serverless Edge Functions.
*   **Fuzzy Search**: Fuse.js for efficient client-side fuzzy searching of song titles and lyrics.
*   **Markdown Rendering**: React Markdown for displaying song lyrics formatted with Markdown.
*   **Icons**: Lucide React for a consistent set of SVG icons.
*   **Build Tool**: Vite for a fast development experience and optimized builds.

## Library Usage Guidelines

To ensure a cohesive and maintainable codebase, please adhere to the following guidelines when choosing and using libraries:

*   **Core UI**: Always use **React** for all components and views.
*   **Styling**: All styling should be done using **Tailwind CSS** utility classes. Avoid custom CSS files or inline styles unless absolutely necessary for dynamic properties.
*   **Component Library**: For common UI elements (buttons, inputs, cards, etc.), prioritize using or extending components from **Shadcn/ui**. If a specific component is not available or needs significant customization, create a new component following the existing project's styling conventions.
*   **Routing**: Use **React Router DOM** for all navigation within the application. Keep main routes defined in `src/App.tsx`.
*   **Backend Interactions**: All database operations, authentication flows, and server-side logic (via Edge Functions) must use the **Supabase** client library (`@supabase/supabase-js`).
*   **Search Functionality**: For client-side fuzzy searching, use **Fuse.js**.
*   **Markdown Display**: When rendering Markdown content (e.g., song lyrics), use **React Markdown**.
*   **Icons**: Integrate icons using **Lucide React**. Avoid using external image-based icons or other icon libraries.
*   **State Management**: For local component state, use React's `useState` and `useReducer` hooks. For global authentication state, use the provided `AuthContext`. Avoid introducing new global state management libraries unless explicitly approved.
*   **Notifications**: For user feedback (success, error, info messages), use the notification system already implemented in `src/contexts/AuthContext.tsx` via `useNotification`.
*   **Backgrounds**: For child-friendly animated backgrounds, use the `ChildFriendlyBackground` component.