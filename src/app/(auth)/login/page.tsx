
import { AuthForm } from "@/components/custom/AuthForm";

export default function LoginPage() {
  // The AuthForm will now handle its own full-page layout
  return <AuthForm mode="login" />;
}
