'use client';

import RideFormPage from '@/components/user/onboarding/RideFormPage';

export default function OpenMatchPage() {
  return <RideFormPage rideType="shared" backHref="/user/onboarding/shared" />;
}
