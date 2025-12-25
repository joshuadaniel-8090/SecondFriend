# **App Name**: NexusConnect

## Core Features:

- Email/Password Authentication: Authenticate users (students and counselors) based on their email and password stored in Firebase Auth.
- Student Dashboard: Allow students to view previous sessions, create new sessions with a title and select an issue tag (stress, academics, relationship, other).
- Counsellor Dashboard: Enable counselors to view pending session requests and accept or ignore them, and view active sessions.
- Real-time Chat System: Facilitate real-time chat between students and counselors using Firestore. Store messages with timestamps, and update the chat UI using onSnapshot listeners.
- Session Management: Create, update, and manage sessions, linking students and counselors. Status updates (pending, active, closed) are stored in Firestore.
- Role-based Redirect: After login, fetch user role from Firestore (student or counsellor). Redirect to the appropriate dashboard and prevent unauthorized access.
- UI State Handling: Show loading spinner while data is fetching, empty state if no sessions or messages exist, and user-friendly error messages if Firestore fails.
- Route Protection: Unauthenticated users are redirected to the login page. Students cannot access counsellor pages, and vice-versa. Block direct URL access if role mismatch.
- Logout Functionality: Add logout button in student and counsellor dashboards. Logout should clear Firebase auth session and redirect to home/login page.

## Style Guidelines:

- Primary color: Light teal (#90EE90) for a calming, mental-health friendly vibe.
- Background color: Very light desaturated green (#F0FFF0) to promote a calm environment.
- Accent color: Soft sky blue (#B0E2FF) for highlights and interactive elements.
- Headline font: 'Space Grotesk' sans-serif font for headlines and short text. Body font: 'Inter' sans-serif font for longer passages of text.
- Use simple, clear icons from a set like Material Icons to represent different session types and actions.
- Spacious layout with rounded cards to create a soft, welcoming interface.
- Use subtle fade and slide animations using Framer Motion for a smooth user experience.