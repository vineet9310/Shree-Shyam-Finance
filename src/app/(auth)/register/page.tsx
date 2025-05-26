import { AuthForm } from "@/components/custom/AuthForm";
import shyamImage from '@/assets/Shyam.jpg'; // Import the local image

export default function RegisterPage() {
  // The AuthForm will now handle its own full-page layout
  return <AuthForm mode="register" imageSrc={shyamImage} />;
}
