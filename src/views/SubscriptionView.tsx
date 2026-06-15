import { motion } from 'motion/react';
import { FreeUsageCard, SubscriptionPlans } from '@/screens/SubscriptionScreen';

interface SubscriptionViewProps {
  focusEnterprise?: boolean;
  onEnterpriseFocused?: () => void;
}

export function SubscriptionView({ focusEnterprise = false, onEnterpriseFocused }: SubscriptionViewProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-full flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 pb-4 pt-12 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">订阅</h1>
        <p className="mt-1 text-sm text-gray-500">用量与套餐方案</p>
      </header>

      <div className="space-y-4 p-4 pb-8">
        <FreeUsageCard />
        <SubscriptionPlans focusPlanId={focusEnterprise ? 'enterprise' : undefined} onPlanFocused={onEnterpriseFocused} />
      </div>
    </motion.div>
  );
}
