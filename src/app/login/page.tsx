import { LoginForm } from "@/components/auth/LoginForm";
import { isDemoMode } from "@/lib/data/crm";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm demoMode={isDemoMode()} />;
}
