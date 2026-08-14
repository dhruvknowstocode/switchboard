import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="board-shell flex min-h-screen items-center justify-center p-6">
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
