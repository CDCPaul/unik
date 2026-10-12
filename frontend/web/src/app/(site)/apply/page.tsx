import type { Metadata } from 'next';
import { ApplyForm } from './ApplyForm';

export const metadata: Metadata = {
  title: 'Apply',
  description: 'Apply for the Seoul Marathon 2027 tour. Takes about 2 minutes, no payment now.',
};

export default function ApplyPage() {
  return (
    <div className="bg-brand-soft">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pb-24 pt-12 sm:px-6">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-race text-[44px] font-extrabold uppercase leading-none text-brand-ink sm:text-[52px]">
            Apply for the Seoul Marathon 2027 Tour
          </h1>
          <p className="text-lg">Takes about 2 minutes. No payment now. Our team will contact you to confirm your slot.</p>
        </div>
        <ApplyForm />
      </div>
    </div>
  );
}
