import Link from 'next/link';
import { BarChartBig } from 'lucide-react';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <BarChartBig className="h-8 w-8" />
      <span className="text-2xl font-bold font-headline">MarketPulse</span>
    </Link>
  );
}
