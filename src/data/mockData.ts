import type {
  AssistantMessage,
  BusinessProfile,
  ConversationTurn,
  IndustryContext,
  ScenePrompt,
  SessionSummary,
  SimultaneousCaption,
  TermEntry,
  TranslationSession,
} from '@/types';

export const SCENES: ScenePrompt[] = [
  { id: 'general', name: '通用场景', icon: 'message', description: '日常沟通、确认信息、简单跟进' },
  { id: 'meeting', name: '正式会议', icon: 'building', description: '报价、交期、合同确认' },
  { id: 'bargain', name: '商务砍价', icon: 'file', description: '压价、让步、付款条件' },
  { id: 'employee', name: '管理员工', icon: 'hard-hat', description: '排班、现场纪律、安全提醒' },
  { id: 'customs', name: '海关查验', icon: 'shield', description: 'HS 编码、发票、装箱单说明' },
  { id: 'hospital', name: '看病就医', icon: 'stethoscope', description: '症状描述、用药确认' },
  { id: 'logistics', name: '物流清关', icon: 'anchor', description: '提柜、滞港、送货排期' },
];

export const INDUSTRIES: IndustryContext[] = [
  { id: 'mining', name: '矿业 / 冶炼', description: '镍矿、煤矿、冶炼厂与设备维护' },
  { id: 'factory', name: '工厂 / 制造', description: '产线、质检、交付和员工管理' },
  { id: 'construction', name: '工程 / 房产', description: '项目现场、材料、承包商沟通' },
  { id: 'ecommerce', name: '电商 / 直播', description: 'SKU、退换货、直播脚本和客服' },
  { id: 'trade', name: '一般贸易', description: '报价、合同、报关和物流节点' },
  { id: 'catering', name: '本地餐饮', description: '门店管理、采购和顾客沟通' },
];

export const DEFAULT_PROFILE: BusinessProfile = {
  industryId: 'mining',
  companyRole: '印尼工厂负责人',
  conciseMode: true,
};

export const DEFAULT_TERMS: TermEntry[] = [
  {
    id: 'term-nickel',
    zh: '镍矿',
    idText: 'bijih nikel',
    category: '矿业 / 冶炼',
    note: '报价和装船单中保持该译法',
    source: 'default',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'term-smelter',
    zh: '冶炼厂',
    idText: 'smelter',
    category: '矿业 / 冶炼',
    note: '印尼商务场景常直接使用英文 smelter',
    source: 'default',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'term-clearance',
    zh: '清关',
    idText: 'bea cukai',
    category: '物流清关',
    note: '涉及海关查验时优先使用正式说法',
    source: 'default',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
];

const businessMeeting: ConversationTurn[] = [
  {
    id: 'turn-1',
    speaker: 'me',
    sourceLanguage: 'zh',
    targetLanguage: 'id',
    sourceText: '我们今天主要确认镍矿这批货的交期和付款节点。',
    translatedText: 'Hari ini kita fokus memastikan jadwal pengiriman bijih nikel dan tahapan pembayaran.',
    terms: ['镍矿', '交期'],
    suggestedAction: '建议把交期写入会议纪要，避免口头承诺不一致。',
  },
  {
    id: 'turn-2',
    speaker: 'counterpart',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    sourceText: 'Kami bisa kirim minggu depan, tetapi pembayaran DP harus masuk sebelum barang keluar.',
    translatedText: '我们可以下周发货，但定金必须在货物出库前到账。',
    terms: ['定金', '发货'],
    suggestedAction: '可追问 DP 比例和到账截止时间。',
  },
  {
    id: 'turn-3',
    speaker: 'me',
    sourceLanguage: 'zh',
    targetLanguage: 'id',
    sourceText: '可以，DP 我们按合同 30% 走，但需要你们先发装箱单和发票。',
    translatedText: 'Bisa, DP akan kami ikuti sesuai kontrak sebesar 30%, tetapi kami perlu packing list dan invoice terlebih dahulu.',
    terms: ['装箱单', '发票'],
    suggestedAction: '装箱单和发票可加入待办事项。',
  },
  {
    id: 'turn-4',
    speaker: 'counterpart',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    sourceText: 'Baik, invoice dan packing list kami kirim sore ini. Untuk jadwal kapal, kami konfirmasi besok pagi.',
    translatedText: '好的，发票和装箱单今天下午发给你们。船期我们明天上午确认。',
    terms: ['发票', '装箱单', '船期'],
    suggestedAction: '建议设置明早跟进船期。',
  },
  {
    id: 'turn-5',
    speaker: 'me',
    sourceLanguage: 'zh',
    targetLanguage: 'id',
    sourceText: '请同时确认是否会产生滞港费，如果有费用要提前说明。',
    translatedText: 'Tolong sekaligus konfirmasi apakah akan ada biaya demurrage. Jika ada, mohon informasikan terlebih dahulu.',
    terms: ['滞港费'],
    suggestedAction: '滞港费属于风险项，建议标红保存。',
  },
  {
    id: 'turn-6',
    speaker: 'counterpart',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    sourceText: 'Untuk demurrage, biasanya ditanggung pihak yang terlambat mengurus dokumen. Saya cek dulu kondisi pelabuhan hari ini.',
    translatedText: '关于滞港费，通常由延误处理单据的一方承担。我先确认一下今天港口的情况。',
    terms: ['滞港费', '单据', '港口情况'],
    suggestedAction: '费用责任仍需书面确认，建议要求对方回复承担规则。',
  },
  {
    id: 'turn-7',
    speaker: 'me',
    sourceLanguage: 'zh',
    targetLanguage: 'id',
    sourceText: '好的，请在下午五点前把发票、装箱单、船期和滞港费说明一起发给我。',
    translatedText: 'Baik, mohon kirim invoice, packing list, jadwal kapal, dan penjelasan demurrage kepada saya sebelum jam lima sore.',
    terms: ['下午五点', '发票', '装箱单', '船期', '滞港费'],
    suggestedAction: '可把下午五点设为待办截止时间。',
  },
];

const generalConversation: ConversationTurn[] = [
  {
    id: 'general-1',
    speaker: 'me',
    sourceLanguage: 'zh',
    targetLanguage: 'id',
    sourceText: '你好，我想先确认一下今天需要沟通的重点。',
    translatedText: 'Halo, saya ingin memastikan terlebih dahulu poin utama yang perlu kita bicarakan hari ini.',
    terms: ['沟通重点'],
    suggestedAction: '适合用于不确定场景的开场确认。',
  },
  {
    id: 'general-2',
    speaker: 'counterpart',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    sourceText: 'Baik, kita bisa mulai dari jadwal, biaya, dan dokumen yang diperlukan.',
    translatedText: '好的，我们可以先从时间安排、费用和需要的文件开始。',
    terms: ['时间安排', '费用', '文件'],
    suggestedAction: '可继续追问具体时间和责任人。',
  },
  {
    id: 'general-3',
    speaker: 'me',
    sourceLanguage: 'zh',
    targetLanguage: 'id',
    sourceText: '请把关键事项发给我，我会整理后再确认下一步。',
    translatedText: 'Tolong kirimkan poin-poin penting kepada saya. Saya akan merapikannya lalu mengonfirmasi langkah berikutnya.',
    terms: ['关键事项', '下一步'],
    suggestedAction: '结束后可自动沉淀成待办。',
  },
  {
    id: 'general-4',
    speaker: 'counterpart',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    sourceText: 'Saya kirim sore ini. Jika ada perubahan, saya kabari lewat WhatsApp.',
    translatedText: '我今天下午发给你。如果有变化，我会通过 WhatsApp 告诉你。',
    terms: ['下午', '变更通知'],
    suggestedAction: '建议记录对方承诺的发送时间。',
  },
];

const customsCheck: ConversationTurn[] = [
  {
    id: 'customs-1',
    speaker: 'counterpart',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    sourceText: 'Petugas meminta HS code dan invoice asli untuk pemeriksaan.',
    translatedText: '工作人员要求提供 HS 编码和原始发票进行查验。',
    terms: ['HS 编码', '发票', '查验'],
    suggestedAction: '建议从文件夹调出报关资料。',
  },
  {
    id: 'customs-2',
    speaker: 'me',
    sourceLanguage: 'zh',
    targetLanguage: 'id',
    sourceText: '请告诉他，这批货是设备配件，不是整机。',
    translatedText: 'Mohon sampaikan bahwa barang ini adalah suku cadang peralatan, bukan mesin utuh.',
    terms: ['设备配件', '整机'],
    suggestedAction: '可加入术语库，减少海关品名误解。',
  },
];

export const SCENE_SCRIPTS: Record<string, ConversationTurn[]> = {
  general: generalConversation,
  meeting: businessMeeting,
  bargain: businessMeeting.map((turn) => ({ ...turn, id: `bargain-${turn.id}` })),
  employee: [
    {
      id: 'employee-1',
      speaker: 'me',
      sourceLanguage: 'zh',
      targetLanguage: 'id',
      sourceText: '今天夜班必须戴安全帽，进入冶炼厂前先登记。',
      translatedText: 'Shift malam hari ini wajib memakai helm keselamatan dan mendaftar sebelum masuk ke smelter.',
      terms: ['安全帽', '冶炼厂'],
      suggestedAction: '安全要求适合保存为常用句。',
    },
  ],
  customs: customsCheck,
  hospital: [
    {
      id: 'hospital-1',
      speaker: 'me',
      sourceLanguage: 'zh',
      targetLanguage: 'id',
      sourceText: '他昨晚开始发烧，今天咳嗽更严重。',
      translatedText: 'Dia mulai demam sejak tadi malam, dan hari ini batuknya semakin parah.',
      terms: ['发烧', '咳嗽'],
      suggestedAction: '医疗场景应避免过度简化症状。',
    },
  ],
  logistics: [
    {
      id: 'logistics-1',
      speaker: 'counterpart',
      sourceLanguage: 'id',
      targetLanguage: 'zh',
      sourceText: 'Kontainer belum bisa keluar karena dokumen DO belum lengkap.',
      translatedText: '集装箱还不能提走，因为提货单文件还不完整。',
      terms: ['集装箱', '提货单'],
      suggestedAction: '建议追问缺哪一份文件。',
    },
  ],
};

export const PHOTO_TRANSLATION = {
  title: '装箱单识别',
  sourceType: '现场单据照片',
  original: ['Packing List No. PL-7782', 'Item: Nickel ore sample bags', 'Qty: 38 bags', 'Port: Morowali'],
  translated: ['装箱单编号：PL-7782', '品名：镍矿样品袋', '数量：38 袋', '港口：莫罗瓦利'],
  terms: ['镍矿', '装箱单', '港口'],
};

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PHOTO_HISTORY_ORIGINAL_IMAGE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fafc"/>
      <stop offset="1" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="720" height="960" fill="#0f172a"/>
  <g transform="translate(74 56) rotate(-2 286 424)">
    <rect width="572" height="848" rx="18" fill="url(#paper)"/>
    <rect x="34" y="34" width="504" height="780" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="64" y="92" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#111827">PACKING LIST</text>
    <text x="64" y="132" font-family="Arial, sans-serif" font-size="18" fill="#64748b">PT MOROWALI MINERAL SUPPLY</text>
    <line x1="64" y1="168" x2="506" y2="168" stroke="#94a3b8" stroke-width="2"/>
    <text x="64" y="220" font-family="Arial, sans-serif" font-size="24" fill="#111827">Packing List No. PL-7782</text>
    <text x="64" y="274" font-family="Arial, sans-serif" font-size="24" fill="#111827">Item: Nickel ore sample bags</text>
    <text x="64" y="328" font-family="Arial, sans-serif" font-size="24" fill="#111827">Qty: 38 bags</text>
    <text x="64" y="382" font-family="Arial, sans-serif" font-size="24" fill="#111827">Port: Morowali</text>
    <text x="64" y="436" font-family="Arial, sans-serif" font-size="24" fill="#111827">Truck No: B 3172 KLM</text>
    <rect x="64" y="494" width="442" height="150" rx="10" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="88" y="548" font-family="Arial, sans-serif" font-size="20" fill="#334155">Note: Sample bags must be sealed</text>
    <text x="88" y="590" font-family="Arial, sans-serif" font-size="20" fill="#334155">before loading to container.</text>
    <rect x="64" y="704" width="178" height="46" fill="none" stroke="#64748b" stroke-width="2"/>
    <text x="84" y="735" font-family="Arial, sans-serif" font-size="18" fill="#475569">Warehouse</text>
    <rect x="328" y="704" width="178" height="46" fill="none" stroke="#64748b" stroke-width="2"/>
    <text x="366" y="735" font-family="Arial, sans-serif" font-size="18" fill="#475569">Driver</text>
  </g>
</svg>
`);

const PHOTO_HISTORY_TRANSLATED_IMAGE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960">
  <rect width="720" height="960" fill="#0f172a"/>
  <g transform="translate(74 56) rotate(-2 286 424)">
    <rect width="572" height="848" rx="18" fill="#f8fafc"/>
    <rect x="34" y="34" width="504" height="780" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="64" y="92" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#111827">PACKING LIST</text>
    <rect x="60" y="106" width="214" height="38" rx="8" fill="#dbeafe"/>
    <text x="76" y="132" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#1d4ed8">装箱单</text>
    <line x1="64" y1="168" x2="506" y2="168" stroke="#94a3b8" stroke-width="2"/>
    <text x="64" y="220" font-family="Arial, sans-serif" font-size="24" fill="#111827">Packing List No. PL-7782</text>
    <rect x="60" y="234" width="274" height="38" rx="8" fill="#dbeafe"/>
    <text x="76" y="260" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#1d4ed8">装箱单编号：PL-7782</text>
    <text x="64" y="318" font-family="Arial, sans-serif" font-size="24" fill="#111827">Item: Nickel ore sample bags</text>
    <rect x="60" y="332" width="272" height="38" rx="8" fill="#dcfce7"/>
    <text x="76" y="358" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#047857">品名：镍矿样品袋</text>
    <text x="64" y="416" font-family="Arial, sans-serif" font-size="24" fill="#111827">Qty: 38 bags</text>
    <rect x="60" y="430" width="174" height="38" rx="8" fill="#fef3c7"/>
    <text x="76" y="456" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#92400e">数量：38 袋</text>
    <text x="64" y="514" font-family="Arial, sans-serif" font-size="24" fill="#111827">Port: Morowali</text>
    <rect x="60" y="528" width="204" height="38" rx="8" fill="#e0e7ff"/>
    <text x="76" y="554" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#3730a3">港口：莫罗瓦利</text>
    <rect x="64" y="638" width="442" height="96" rx="12" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="88" y="678" font-family="Arial, sans-serif" font-size="20" fill="#1e3a8a">备注：样品袋装柜前需密封。</text>
    <text x="88" y="714" font-family="Arial, sans-serif" font-size="18" fill="#475569">已自动保留原文位置并叠加译文。</text>
  </g>
</svg>
`);

export const MOCK_PHOTO_TRANSLATION_SESSION: TranslationSession = {
  id: 'mock-photo-translation-packing-list',
  sceneId: 'logistics',
  industryId: 'mining',
  concise: true,
  startedAt: '2026-06-04T09:20:00.000Z',
  endedAt: '2026-06-04T09:22:00.000Z',
  turns: [],
  summary: {
    title: '拍照翻译：装箱单',
    minutes: [
      '识别到装箱单编号 PL-7782，品名为镍矿样品袋。',
      '数量为 38 袋，港口为 Morowali / 莫罗瓦利。',
    ],
    todos: ['核对装箱单编号和实际装车数量', '确认样品袋装柜前已密封'],
    terms: ['装箱单', '镍矿', '莫罗瓦利'],
  },
  favoriteTurnIds: [],
  photoTranslation: {
    originalImageUrl: PHOTO_HISTORY_ORIGINAL_IMAGE,
    translatedImageUrl: PHOTO_HISTORY_TRANSLATED_IMAGE,
    sourceType: '现场单据照片',
  },
};

export const SIMULTANEOUS_CAPTIONS: SimultaneousCaption[] = [
  {
    id: 'sim-1',
    speakerId: 'speaker-1',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    originalText: 'Jadwal kapal minggu depan masih menunggu konfirmasi dari pelabuhan.',
    translatedText: '下周船期还在等港口确认。',
    startedAt: '00:12',
    confidence: 0.94,
    keywords: ['船期', '港口确认'],
  },
  {
    id: 'sim-2',
    speakerId: 'speaker-2',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    originalText: 'Kalau DP sudah masuk hari ini, kami bisa tahan slot pengiriman untuk Anda.',
    translatedText: '如果今天定金到账，我们可以为你们保留发货舱位。',
    startedAt: '00:20',
    confidence: 0.91,
    keywords: ['DP', '发货舱位'],
  },
  {
    id: 'sim-3',
    speakerId: 'speaker-1',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    originalText: 'Tolong pastikan invoice dan packing list dikirim sebelum jam lima sore.',
    translatedText: '请确认发票和装箱单在下午五点前发出。',
    startedAt: '00:31',
    confidence: 0.96,
    keywords: ['发票', '装箱单'],
  },
  {
    id: 'sim-4',
    speakerId: 'speaker-2',
    sourceLanguage: 'id',
    targetLanguage: 'zh',
    originalText: 'Untuk biaya demurrage, pihak yang terlambat mengurus dokumen yang menanggung.',
    translatedText: '关于滞港费，由延误处理单据的一方承担。',
    startedAt: '00:42',
    confidence: 0.89,
    keywords: ['滞港费', '费用承担'],
  },
];

export const CONTACTS = [
  { id: 'new-contact', name: '新联系人', lastCall: '刚刚', online: true, contactCode: 'KLY-5208', source: 'app' },
  { id: '1', name: 'Budi', lastCall: '2小时前', online: true, contactCode: 'KLY-8421', source: 'app' },
  { id: '2', name: 'Sari', lastCall: '昨天', online: false, contactCode: 'KLY-3095', source: 'app' },
  { id: '3', name: 'Adi', lastCall: '3天前', online: true, contactCode: 'KLY-6178', source: 'app' },
  { id: 'web-1', name: '网页访客', lastCall: '18分钟前', online: false, contactCode: '', source: 'web' },
  { id: 'web-2', name: '网页访客', lastCall: '1小时前', online: false, contactCode: '', source: 'web' },
  { id: 'web-3', name: '网页访客', lastCall: '昨天', online: false, contactCode: '', source: 'web' },
];

export const ASSISTANT_TASKS = [
  { id: 'minutes', label: '生成会议纪要', prompt: '根据最近翻译记录生成会议纪要' },
  { id: 'todo', label: '提取待办事项', prompt: '提取需要跟进的合同、船期、文件事项' },
  { id: 'email', label: '起草往来信息', prompt: '起草一条给印尼供应商的跟进信息' },
  { id: 'news', label: '查询印尼新闻', prompt: '整理与物流和矿业相关的印尼本地信息' },
  { id: 'culture', label: '文化背景解释', prompt: '解释印尼商务沟通里委婉表达的含义' },
];

export function makeSummary(turns: ConversationTurn[]): SessionSummary {
  const terms = Array.from(new Set(turns.flatMap((turn) => turn.terms))).slice(0, 8);
  if (!terms.includes('镍矿')) {
    return {
      title: '沟通要点与后续安排',
      minutes: [
        '双方确认本次沟通重点为需求、时间安排和后续跟进。',
        '对方会补充关键事项，并在约定时间内发送给我方。',
        '后续如有变化，将通过即时通讯继续确认。',
      ],
      todos: ['等待对方发送关键事项', '整理信息后确认下一步', '记录时间、费用和文件要求'],
      terms,
    };
  }

  return {
    title: '镍矿交付与付款节点确认',
    minutes: [
      '双方确认本批货重点为交期、DP 付款和单据交付。',
      '供应商承诺今天下午发送发票和装箱单。',
      '船期将在明天上午再次确认。',
    ],
    todos: ['跟进发票和装箱单', '明早确认船期', '确认是否产生滞港费'],
    terms,
  };
}

export function makeAssistantResponse(taskId: string, historyCount: number): AssistantMessage[] {
  const now = new Date().toISOString();
  const base = `已读取 ${historyCount} 条本地翻译记录，以下为整理结果。`;
  const contentByTask: Record<string, string> = {
    minutes: `${base}\n\n会议纪要：\n1. 本次沟通重点是镍矿交期、DP 付款、发票和装箱单。\n2. 对方承诺今天下午提供单据。\n3. 船期需要明天上午再次确认。\n\n风险提醒：滞港费承担方尚未明确。`,
    todo: `${base}\n\n待办：\n- 今天 17:00 前检查 invoice 和 packing list。\n- 明天 10:00 前追问船期。\n- 要求对方书面说明 demurrage 费用。`,
    email: `${base}\n\nSubject: Follow-up on Invoice, Packing List and Vessel Schedule\n\nDear team, please send the invoice and packing list this afternoon as discussed. We will proceed with the 30% DP according to the contract after checking the documents. Please also confirm the vessel schedule tomorrow morning and inform us in advance if any demurrage fee may occur.`,
    news: `${base}\n\n本地信息摘要：矿业物流沟通中，船期、港口拥堵和清关单据仍是高频风险点。建议所有费用承诺保留书面记录。`,
    culture: `${base}\n\n文化解释：印尼商务语境里 “besok pagi kami konfirmasi” 常表示仍需内部确认，不等于最终承诺。建议追问明确时间和责任人。`,
  };
  const selected = contentByTask[taskId] ?? `${base}\n\n我可以继续基于翻译历史整理摘要、邮件或术语。`;
  return [
    { id: `user-${taskId}`, role: 'user', content: ASSISTANT_TASKS.find((task) => task.id === taskId)?.prompt ?? '帮我处理这次沟通', createdAt: now },
    { id: `assistant-${taskId}`, role: 'assistant', content: selected, createdAt: now },
  ];
}
