import { Toaster } from 'react-hot-toast';
import AuthSplitLayout from '@/components/shared/AuthSplitLayout';
import UserSignUpForm from '@/components/auth/user/UserSignUpForm';

function UserSignUpLeft() {
  const bullets = [
    'Fixed weekly routes',
    'Verified co-passengers',
    'Split the fare automatically',
  ];

  return (
    <div className="text-white">
      <div className="mb-10">
        <h2 className="text-4xl font-bold leading-tight mb-2">
          Your daily commute,<br />
          <span style={{ color: '#00C2A8' }}>reinvented.</span>
        </h2>
        <p className="text-white/65 text-[15px] mt-4 leading-relaxed">
          Join thousands of Egyptians who<br />
          split their ride costs every week.
        </p>
      </div>

      <ul className="space-y-3">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2.5 text-white/80 text-sm">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00C2A8' }} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function UserSignUpPage() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthSplitLayout
        role="user"
        leftContent={<UserSignUpLeft />}
        rightContent={<UserSignUpForm />}
      />
    </>
  );
}
