import Link from 'next/link';
import { BarChartBig } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: "sm" | "default";
}

export default function Logo({ size = "default" }: LogoProps) {
  const isSmall = size === "sm";
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <BarChartBig className={cn(isSmall ? "h-6 w-6" : "h-8 w-8")} />
      <span className={cn("font-bold font-headline", isSmall ? "text-xl" : "text-2xl")}>Stockdox</span>
    </Link>
  );
}
