'use client';

import Link from 'next/link';

export default function SignupRolePage() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
          <span className="text-primary font-black text-base">C</span>
        </div>
        <span className="text-white font-bold text-xl tracking-wide">commuter</span>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-white text-[28px] font-bold">Create your account</h1>
        <p className="text-white/60 text-base mt-2">Choose how you want to join Commuter</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Driver card */}
        <RoleCard
          href="/auth/signup/driver"
          icon="🚗"
          title="I'm a Driver"
          description="Earn money by driving weekly cycle routes"
          bullets={['Set your own price', 'Predictable income', 'Flexible schedule']}
          bulletColor="#F5A623"
          ctaLabel="Join as Driver →"
          ctaClass="bg-accent text-primary hover:bg-accent/90"
        />

        {/* Passenger card */}
        <RoleCard
          href="/auth/signup/user"
          icon="👤"
          title="I'm a Passenger"
          description="Book pooled rides and save on daily commutes"
          bullets={['Weekly fixed routes', 'Split fare costs', 'Safe & verified']}
          bulletColor="#00C2A8"
          ctaLabel="Join as Passenger →"
          ctaClass="bg-secondary text-primary hover:bg-secondary/90"
        />
      </div>

      {/* Sign in link */}
      <p className="text-white/50 text-sm mt-8">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-secondary hover:underline font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded">
          Sign in
        </Link>
      </p>
    </div>
  );
}

interface RoleCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  bullets: string[];
  bulletColor: string;
  ctaLabel: string;
  ctaClass: string;
}

function RoleCard({ href, icon, title, description, bullets, bulletColor, ctaLabel, ctaClass }: RoleCardProps) {
  return (
    <div className="group bg-[#1C3557] border border-white/10 rounded-2xl p-8 flex flex-col gap-4 hover:border-secondary hover:scale-[1.02] transition-all duration-200">
      <div className="text-4xl">{icon}</div>
      <div>
        <h2 className="text-white font-bold text-xl">{title}</h2>
        <p className="text-white/60 text-sm mt-1">{description}</p>
      </div>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-white/70">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: bulletColor }}
              aria-hidden="true"
            />
            {b}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-auto w-full text-center py-2.5 rounded-lg font-bold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${ctaClass}`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
