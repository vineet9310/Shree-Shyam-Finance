import { AuthForm } from "@/components/custom/AuthForm";
import shyamImage from '@/assets/KHATUSHYAM.jpg'; // Import the local image

export default function LoginPage() {
  return <AuthForm mode="login" imageSrc={shyamImage} />;
}