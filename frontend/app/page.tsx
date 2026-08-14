import { redirect } from 'next/navigation';

/** Root entry — authenticated shell sends unauthenticated users to /login. */
export default function HomePage() {
  redirect('/dashboard');
}
