// app/page.tsx
// Root page - redirects to dashboard or login

import { redirect } from 'next/navigation';

export default function Home() {
  // For now, redirect to login
  // Later we'll check auth state and redirect to dashboard
  redirect('/auth/login');
}