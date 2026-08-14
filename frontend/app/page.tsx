import { redirect } from 'next/navigation';

/**
 * Root entry — send operators to the control dashboard.
 * TODO: Phase 2 — redirect to /login when unauthenticated.
 */
export default function HomePage() {
  redirect('/dashboard');
}
