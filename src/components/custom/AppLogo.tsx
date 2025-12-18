import { Banknote } from 'lucide-react';
import Link from 'next/link';
import { APP_NAME, ROUTES } from '@/lib/constants';

interface AppLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function AppLogo({ className, iconClassName, textClassName }: AppLogoProps) {
  return (
    <Link href={ROUTES.HOME} className={`flex items-center gap-2 group ${className}`}>
      <Banknote className={`h-7 w-7 text-sidebar-primary group-hover:text-white transition-colors ${iconClassName}`} />
      <span className={`text-xl font-bold text-sidebar-foreground group-hover:text-white transition-colors ${textClassName}`}>
        {APP_NAME}
      </span>
    </Link>
  );
}
