import { AuthForm } from "@/components/custom/AuthForm";
import shyamImage from '@/assets/Shyam.jpg'; // Import the local image

export default function LoginPage() {
  // The AuthForm will now handle its own full-page layout
  return <AuthForm mode="login" imageSrc={shyamImage} />;
}
