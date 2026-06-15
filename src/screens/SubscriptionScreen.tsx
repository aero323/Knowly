import { useEffect, useRef } from 'react';
import { Building2, Camera, CheckCircle2, Crown, Languages, PhoneCall, Sparkles, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { cn } from '@/lib/utils';

interface SubscriptionScreenProps {
  onBack: () => void;
}

type PlanId = 'personal-monthly' | 'travel' | 'enterprise';

interface PlanEntitlement {
  icon: typeof Languages;
  label: string;
  value: string;
}

interface SubscriptionPlan {
  id: PlanId;
  name: string;
  badge: string;
  price: string;
  priceSuffix?: string;
  description: string;
  icon: typeof Crown;
  entitlements: PlanEntitlement[];
  features: string[];
  ctaLabel: string;
}

const FREE_MINUTES_TOTAL = 30;
const FREE_MINUTES_USED = 12;
const FREE_MINUTES_LEFT = FREE_MINUTES_TOTAL - FREE_MINUTES_USED;
const FREE_USAGE_PERCENT = Math.round((FREE_MINUTES_USED / FREE_MINUTES_TOTAL) * 100);

const PLANS: SubscriptionPlan[] = [
  {
    id: 'personal-monthly',
    name: '个人经济版',
    badge: '个人常用',
    price: '¥80',
    description: '日常沟通、会议和客户往来都能覆盖。',
    icon: Crown,
    entitlements: [
      { icon: Languages, label: '面对面 / 同声传译 / 音频通话', value: '30 小时' },
      { icon: Video, label: '视频通话', value: '赠送 4 小时' },
      { icon: Camera, label: '拍照翻译', value: '不限量' },
    ],
    features: ['不限有效期', '用完可续'],
    ctaLabel: '选择个人经济版',
  },
  {
    id: 'travel',
    name: '个人旅行畅用版',
    badge: '旅行推荐',
    price: '¥99',
    priceSuffix: '/10天',
    description: '适合旅行、展会和短期外派的密集现场翻译。',
    icon: Sparkles,
    entitlements: [
      { icon: Languages, label: '面对面 / 同声传译', value: '40 小时' },
      { icon: Video, label: '视频通话', value: '赠送 4 小时' },
      { icon: Camera, label: '拍照翻译', value: '不限量' },
    ],
    features: ['翻译额度更高', '适合短期集中使用'],
    ctaLabel: '选择旅行畅用版',
  },
  {
    id: 'enterprise',
    name: '企业版',
    badge: '团队方案',
    price: '定制报价',
    priceSuffix: '¥3000/月起',
    description: '适合需要统一管理语言资产和团队记录的公司。',
    icon: Building2,
    entitlements: [],
    features: [
      '管理员账号和团队子账号',
      '团队统一配置术语库及场景',
      '历史记录和纪要共享',
      '支持大型线上线下会议字幕同步翻译',
      '企业内外均可使用',
      '其他需求定制请与销售沟通',
    ],
    ctaLabel: '立即咨询',
  },
];

const PLAN_STYLE: Record<
  PlanId,
  {
    card: string;
    badge: string;
    iconWrap: string;
    icon: string;
    price: string;
    body: string;
    entitlement: string;
    entitlementIcon: string;
    feature: string;
    check: string;
    cta: string;
  }
> = {
  'personal-monthly': {
    card: 'border-blue-100 bg-white text-gray-950 shadow-sm',
    badge: 'bg-blue-50 text-blue-700',
    iconWrap: 'bg-blue-50 text-blue-600',
    icon: 'text-blue-600',
    price: 'text-blue-600',
    body: 'text-gray-500',
    entitlement: 'bg-blue-50/80 text-gray-900',
    entitlementIcon: 'text-blue-600',
    feature: 'text-gray-600',
    check: 'text-blue-600',
    cta: 'bg-blue-600 text-white active:bg-blue-700',
  },
  travel: {
    card: 'border-emerald-100 bg-white text-gray-950 shadow-sm',
    badge: 'bg-emerald-50 text-emerald-700',
    iconWrap: 'bg-emerald-50 text-emerald-600',
    icon: 'text-emerald-600',
    price: 'text-emerald-600',
    body: 'text-gray-500',
    entitlement: 'bg-emerald-50/80 text-gray-900',
    entitlementIcon: 'text-emerald-600',
    feature: 'text-gray-600',
    check: 'text-emerald-600',
    cta: 'bg-emerald-600 text-white active:bg-emerald-700',
  },
  enterprise: {
    card: 'border-zinc-900 bg-zinc-950 text-white shadow-sm',
    badge: 'bg-amber-100 text-amber-800',
    iconWrap: 'bg-white/10 text-amber-200',
    icon: 'text-amber-200',
    price: 'text-amber-100',
    body: 'text-zinc-300',
    entitlement: 'bg-white/10 text-white',
    entitlementIcon: 'text-amber-200',
    feature: 'text-zinc-200',
    check: 'text-amber-200',
    cta: 'bg-amber-200 text-zinc-950 active:bg-amber-100',
  },
};

export function FreeUsageCard() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
            <Crown className="h-4 w-4 text-blue-600" />
            免费用量
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-950">{FREE_MINUTES_LEFT} 分钟</p>
          <p className="mt-1 text-xs text-gray-500">免费额度 {FREE_MINUTES_TOTAL} 分钟，已用 {FREE_MINUTES_USED} 分钟</p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">本月</span>
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${FREE_USAGE_PERCENT}%` }} />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>升级会员解锁更多时长</span>
        </div>
      </div>
    </section>
  );
}

interface SubscriptionPlansProps {
  focusPlanId?: PlanId;
  onPlanFocused?: () => void;
}

export function SubscriptionPlans({ focusPlanId, onPlanFocused }: SubscriptionPlansProps = {}) {
  const focusPlanRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!focusPlanId || !focusPlanRef.current) return;

    window.requestAnimationFrame(() => {
      focusPlanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onPlanFocused?.();
    });
  }, [focusPlanId, onPlanFocused]);

  return (
    <section className="space-y-3" aria-label="订阅套餐">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">订阅套餐</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">3 种方案</span>
      </div>

      {PLANS.map((plan, index) => {
        const styles = PLAN_STYLE[plan.id];
        const PlanIcon = plan.icon;

        return (
          <motion.article
            key={plan.id}
            ref={plan.id === focusPlanId ? focusPlanRef : undefined}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn('rounded-2xl border p-4', styles.card)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', styles.badge)}>{plan.badge}</span>
                <h3 className="mt-3 text-lg font-bold leading-tight">{plan.name}</h3>
                <p className={cn('mt-1 text-sm leading-relaxed', styles.body)}>{plan.description}</p>
              </div>
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', styles.iconWrap)}>
                <PlanIcon className={cn('h-5 w-5', styles.icon)} />
              </div>
            </div>

            <div className="mt-4 flex items-end gap-1.5">
              <span className={cn('text-3xl font-black tracking-tight', styles.price)}>{plan.price}</span>
              {plan.priceSuffix && <span className={cn('pb-1 text-sm font-semibold', styles.body)}>{plan.priceSuffix}</span>}
            </div>

            {plan.entitlements.length > 0 && (
              <div className="mt-4 grid gap-2">
                {plan.entitlements.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <div key={item.label} className={cn('flex items-center justify-between gap-3 rounded-xl px-3 py-2.5', styles.entitlement)}>
                      <div className="flex min-w-0 items-center gap-2">
                        <ItemIcon className={cn('h-4 w-4 shrink-0', styles.entitlementIcon)} />
                        <span className="truncate text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {plan.features.length > 0 && (
              <div className="mt-4 space-y-2.5">
                {plan.features.map((feature) => (
                  <div key={feature} className={cn('flex items-start gap-2.5 text-sm leading-relaxed', styles.feature)}>
                    <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', styles.check)} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className={cn('mt-4 min-h-12 w-full rounded-xl text-sm font-semibold active:scale-[0.99]', styles.cta)}>
              {plan.ctaLabel}
            </button>
          </motion.article>
        );
      })}
    </section>
  );
}

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader title="会员订阅" subtitle="订阅套餐与企业方案" onBack={onBack} />

      <div className="space-y-4 p-4">
        <SubscriptionPlans />
      </div>
    </motion.div>
  );
}
