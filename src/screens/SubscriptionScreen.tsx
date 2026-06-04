import { useState } from 'react';
import { Bot, CheckCircle2, Crown, Languages, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ScreenHeader } from '@/components/ScreenHeader';

interface SubscriptionScreenProps {
  onBack: () => void;
}

type PlanId = 'pro' | 'ultra';
type BillingId = 'renew' | 'monthly' | 'yearly';

interface BillingOption {
  id: BillingId;
  label: string;
  price: string;
  suffix: string;
  helper: string;
  badge?: string;
}

interface Plan {
  id: PlanId;
  name: string;
  description: string;
  highlight: string;
  icon: typeof Crown;
  services: Array<{
    icon: typeof Languages;
    label: string;
    value: string;
  }>;
  billings: BillingOption[];
  benefits: string[];
}

const PLANS: Plan[] = [
  {
    id: 'pro',
    name: 'Knowly Pro',
    description: '适合日常会议、AI 通话和客户沟通的印尼本地业务场景。',
    highlight: '翻译 + AI通话',
    icon: Crown,
    services: [
      { icon: Languages, label: '翻译时长', value: '10 小时 / 月' },
      { icon: PhoneCall, label: 'AI通话', value: '3 小时 / 月' },
    ],
    billings: [
      { id: 'renew', label: '连续包月', price: 'Rp 89.000', suffix: '/ 月', helper: '自动续费，可随时取消', badge: '省 10%' },
      { id: 'monthly', label: '月付', price: 'Rp 99.000', suffix: '/ 月', helper: '单月购买，不自动续费' },
      { id: 'yearly', label: '年付', price: 'Rp 948.000', suffix: '/ 年', helper: '折合 Rp 79.000 / 月', badge: '省 20%' },
    ],
    benefits: ['实时语音翻译优先队列', '会议摘要与待办自动生成', 'AI通话字幕与双语摘要', '团队术语库同步'],
  },
  {
    id: 'ultra',
    name: 'Knowly Ultra',
    description: '适合高频会议、高频 AI 通话和需要 AI 助理跟进的团队。',
    highlight: '更多时长 + AI 助理',
    icon: Sparkles,
    services: [
      { icon: Languages, label: '翻译时长', value: '40 小时 / 月' },
      { icon: PhoneCall, label: 'AI通话', value: '12 小时 / 月' },
      { icon: Bot, label: 'AI 助理', value: '无限次对话' },
    ],
    billings: [
      { id: 'renew', label: '连续包月', price: 'Rp 179.000', suffix: '/ 月', helper: '自动续费，可随时取消', badge: '省 10%' },
      { id: 'monthly', label: '月付', price: 'Rp 199.000', suffix: '/ 月', helper: '单月购买，不自动续费' },
      { id: 'yearly', label: '年付', price: 'Rp 1.908.000', suffix: '/ 年', helper: '折合 Rp 159.000 / 月', badge: '省 20%' },
    ],
    benefits: ['包含 Pro 全部权益', '高频翻译与 AI 通话额度', '无限量AI助理使用', '优先体验新模型能力'],
  },
];

const DEFAULT_BILLING: Record<PlanId, BillingId> = {
  pro: 'monthly',
  ultra: 'monthly',
};

const PLAN_STYLE: Record<
  PlanId,
  {
    card: string;
    tabActive: string;
    tabInactive: string;
    tabIcon: string;
    title: string;
    highlight: string;
    recommendation: string;
    body: string;
    service: string;
    serviceIcon: string;
    billingSelected: string;
    billingIdle: string;
    muted: string;
    panel: string;
    shield: string;
    check: string;
    cta: string;
  }
> = {
  pro: {
    card: 'border border-blue-100 bg-white text-gray-950 shadow-sm',
    tabActive: 'bg-white text-[#2D63FF] shadow-sm ring-1 ring-blue-100',
    tabInactive: 'text-gray-500 active:bg-white/70',
    tabIcon: 'text-[#2D63FF]',
    title: 'text-[#2D63FF]',
    highlight: 'bg-blue-50 text-[#2D63FF]',
    recommendation: 'bg-blue-50 text-[#2D63FF]',
    body: 'text-gray-600',
    service: 'bg-blue-50/80',
    serviceIcon: 'text-[#2D63FF]',
    billingSelected: 'border-[#2D63FF] bg-blue-50 text-gray-950',
    billingIdle: 'border-gray-200 bg-white text-gray-950',
    muted: 'text-gray-500',
    panel: 'bg-gray-50',
    shield: 'text-[#2D63FF]',
    check: 'text-[#2D63FF]',
    cta: 'bg-[#2D63FF] text-white active:bg-blue-700',
  },
  ultra: {
    card: 'bg-zinc-950 text-white shadow-sm',
    tabActive: 'bg-zinc-950 text-white shadow-sm',
    tabInactive: 'text-gray-500 active:bg-white/70',
    tabIcon: 'text-amber-300',
    title: 'text-amber-100',
    highlight: 'bg-amber-300/15 text-amber-100',
    recommendation: 'bg-amber-100 text-amber-800',
    body: 'text-zinc-300',
    service: 'bg-white/10',
    serviceIcon: 'text-amber-200',
    billingSelected: 'border-amber-200 bg-amber-50 text-zinc-950',
    billingIdle: 'border-white/10 bg-white/5 text-white',
    muted: 'text-zinc-400',
    panel: 'bg-white/10',
    shield: 'text-amber-200',
    check: 'text-amber-200',
    cta: 'bg-amber-200 text-zinc-950 active:bg-amber-100',
  },
};

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
  const [activePlanId, setActivePlanId] = useState<PlanId>('pro');
  const [selectedBilling, setSelectedBilling] = useState<Record<PlanId, BillingId>>(DEFAULT_BILLING);
  const activePlan = PLANS.find((plan) => plan.id === activePlanId) ?? PLANS[0];
  const activeBilling = activePlan.billings.find((item) => item.id === selectedBilling[activePlan.id]) ?? activePlan.billings[0];
  const ActivePlanIcon = activePlan.icon;
  const styles = PLAN_STYLE[activePlan.id];

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader title="会员订阅" subtitle="选择 Pro 或 Ultra，解锁翻译、AI通话和 AI 助理" onBack={onBack} />

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-gray-100 p-1.5 shadow-sm" role="tablist" aria-label="会员套餐">
          {PLANS.map((plan) => {
            const selected = plan.id === activePlanId;
            const PlanIcon = plan.icon;
            const tabStyle = PLAN_STYLE[plan.id];

            return (
              <button
                key={plan.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActivePlanId(plan.id)}
                className={cn('min-h-16 rounded-xl px-3 py-2.5 text-left transition active:scale-[0.99]', selected ? tabStyle.tabActive : tabStyle.tabInactive)}
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <PlanIcon className={cn('w-4 h-4', selected ? tabStyle.tabIcon : 'text-gray-400')} />
                  {plan.name.replace('Knowly ', '')}
                </div>
                <div className={cn('mt-1 text-xs font-medium leading-snug', selected ? '' : 'text-gray-500')}>{plan.highlight}</div>
              </button>
            );
          })}
        </div>

        <motion.section
          key={activePlan.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-2xl p-4', styles.card)}
        >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={cn('flex items-center gap-2 text-sm font-semibold', styles.title)}>
                    <ActivePlanIcon className="w-4 h-4" />
                    {activePlan.name}
                  </div>
                  <div className={cn('mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', styles.highlight)}>
                    {activePlan.highlight}
                  </div>
                </div>
                {activePlan.id === 'ultra' && (
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', styles.recommendation)}>推荐</span>
                )}
              </div>

              <p className={cn('mt-3 text-sm leading-relaxed', styles.body)}>{activePlan.description}</p>

              <div className="mt-4 grid gap-2">
                {activePlan.services.map((service) => {
                  const ServiceIcon = service.icon;

                  return (
                    <div key={service.label} className={cn('flex items-center justify-between rounded-xl px-3 py-2.5', styles.service)}>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ServiceIcon className={cn('w-4 h-4', styles.serviceIcon)} />
                        <span>{service.label}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums">{service.value}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2">
                {activePlan.billings.map((billing) => {
                  const selected = activeBilling.id === billing.id;

                  return (
                    <button
                      key={billing.id}
                      type="button"
                      onClick={() => setSelectedBilling((current) => ({ ...current, [activePlan.id]: billing.id }))}
                      className={cn(
                        'min-h-16 w-full rounded-xl border p-3 text-left transition active:scale-[0.99]',
                        selected ? styles.billingSelected : styles.billingIdle,
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{billing.label}</span>
                            {billing.badge && (
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                                  activePlan.id === 'ultra'
                                    ? selected ? 'bg-amber-100 text-amber-800' : 'bg-amber-200/15 text-amber-100'
                                    : selected ? 'bg-blue-100 text-[#2D63FF]' : 'bg-blue-50 text-[#2D63FF]',
                                )}
                              >
                                {billing.badge}
                              </span>
                            )}
                          </div>
                          <p className={cn('mt-1 text-xs', selected ? 'text-gray-500' : styles.muted)}>{billing.helper}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-base font-bold tabular-nums">{billing.price}</div>
                          <div className={cn('text-xs', selected ? 'text-gray-500' : styles.muted)}>{billing.suffix}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className={cn('mt-4 rounded-xl p-3', styles.panel)}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className={cn('w-4 h-4', styles.shield)} />
                  会员权益
                </div>
                <div className="mt-3 space-y-2.5">
                  {activePlan.benefits.map((benefit) => (
                    <div key={benefit} className={cn('flex items-center gap-2.5 text-sm', activePlan.id === 'ultra' ? 'text-zinc-200' : 'text-gray-700')}>
                      <CheckCircle2 className={cn('w-4 h-4 shrink-0', styles.check)} />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={cn('mt-4 min-h-12 w-full rounded-xl text-sm font-semibold active:scale-[0.99]', styles.cta)}
              >
                选择 {activePlan.name.replace('Knowly ', '')} · {activeBilling.label}
              </button>
        </motion.section>
      </div>
    </motion.div>
  );
}
