import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard
  // AuthGuard will redirect users to their role-appropriate home page if needed
  redirect('/dashboard')
}
