import type { SimultaneousCaption } from '../../src/types';

export const DESKTOP_IPC = {
  runtimeInfo: 'desktop:runtime-info',
  overlayShow: 'desktop:overlay-show',
  overlayHide: 'desktop:overlay-hide',
  overlaySettingsGet: 'desktop:overlay-settings-get',
  overlaySettingsSet: 'desktop:overlay-settings-set',
  overlaySettingsChanged: 'desktop:overlay-settings-changed',
  overlayFullscreenToggle: 'desktop:overlay-fullscreen-toggle',
  captionsStart: 'desktop:captions-start',
  captionsPause: 'desktop:captions-pause',
  captionsResume: 'desktop:captions-resume',
  captionsStop: 'desktop:captions-stop',
  captionsStateGet: 'desktop:captions-state-get',
  captionsStateChanged: 'desktop:captions-state-changed',
  captionsLanguageStatesChanged: 'desktop:captions-language-states-changed',
  captionsLine: 'desktop:captions-line',
} as const;

export type DesktopSourceLanguage = 'auto' | 'id' | 'zh' | 'en';
export const DESKTOP_TARGET_LANGUAGE_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'en', label: '英语' },
  { value: 'zh', label: '中文' },
  { value: 'id', label: '印尼语' },
  { value: 'ms', label: '马来语' },
  { value: 'th', label: '泰语' },
  { value: 'vi', label: '越南语' },
  { value: 'fil', label: '菲律宾语' },
  { value: 'my', label: '缅甸语' },
  { value: 'km', label: '高棉语' },
  { value: 'lo', label: '老挝语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'es', label: '西班牙语' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' },
  { value: 'ar', label: '阿拉伯语' },
  { value: 'hi', label: '印地语' },
  { value: 'pt', label: '葡萄牙语' },
] as const;
export type DesktopTargetLanguage = (typeof DESKTOP_TARGET_LANGUAGE_OPTIONS)[number]['value'];
export type DesktopActiveTargetLanguage = Exclude<DesktopTargetLanguage, 'none'>;

export interface DesktopRuntimeInfo {
  appVersion: string;
  isPackaged: boolean;
  platform: string;
}

export interface CaptionOverlaySettings {
  visible: boolean;
  opacity: number;
  fontScale: number;
  showOriginal: boolean;
  showTranslation: boolean;
  scrollMode: boolean;
  visibleLineCount: number;
  fullscreen: boolean;
}

export type DesktopCaptionLanguageStatus = 'connecting' | 'live' | 'error' | 'reconnecting';

export interface DesktopCaptionLanguageState {
  targetLanguage: DesktopActiveTargetLanguage;
  label: string;
  status: DesktopCaptionLanguageStatus;
  message?: string;
  lastSequence?: number;
  updatedAt: string;
}

export interface StartCaptionStreamOptions {
  sourceDevice: string;
  sourceLanguage: DesktopSourceLanguage;
  targetLanguage: DesktopTargetLanguage;
  targetLanguages: DesktopTargetLanguage[];
}

export interface CaptionStreamState extends StartCaptionStreamOptions {
  running: boolean;
  paused: boolean;
  lineCount: number;
  startedAt?: string;
  languageStates?: DesktopCaptionLanguageState[];
}

export type DesktopCaptionLine = Omit<SimultaneousCaption, 'targetLanguage'> & {
  targetLanguage: DesktopTargetLanguage;
  sequence: number;
  receivedAt: string;
  translations?: DesktopCaptionTranslation[];
};

export interface DesktopCaptionTranslation {
  targetLanguage: DesktopActiveTargetLanguage;
  label: string;
  translatedText: string;
}

export function desktopTargetLanguageLabel(language: DesktopTargetLanguage) {
  return DESKTOP_TARGET_LANGUAGE_OPTIONS.find((item) => item.value === language)?.label ?? language;
}

export function normalizeDesktopTargetLanguages(
  targetLanguages: DesktopTargetLanguage[] | undefined,
  fallback: DesktopTargetLanguage = 'zh',
): DesktopTargetLanguage[] {
  const next = (targetLanguages?.length ? targetLanguages : [fallback]).slice(0, 3);
  return next.length > 0 ? next : ['none'];
}

export function activeDesktopTargetLanguages(
  targetLanguages: DesktopTargetLanguage[] | undefined,
  fallback: DesktopTargetLanguage = 'zh',
): DesktopActiveTargetLanguage[] {
  const seen = new Set<DesktopActiveTargetLanguage>();
  const normalized = normalizeDesktopTargetLanguages(targetLanguages, fallback);

  return normalized
    .filter((language): language is DesktopActiveTargetLanguage => language !== 'none')
    .filter((language) => {
      if (seen.has(language)) return false;
      seen.add(language);
      return true;
    })
    .slice(0, 3);
}

export function buildDesktopCaptionLanguageStates(
  targetLanguages: DesktopTargetLanguage[] | undefined,
  fallback: DesktopTargetLanguage = 'zh',
  status: DesktopCaptionLanguageStatus = 'live',
  message?: string,
  lastSequence?: number,
): DesktopCaptionLanguageState[] {
  const updatedAt = new Date().toISOString();

  return activeDesktopTargetLanguages(targetLanguages, fallback).map((targetLanguage) => ({
    targetLanguage,
    label: desktopTargetLanguageLabel(targetLanguage),
    status,
    message,
    lastSequence,
    updatedAt,
  }));
}

type CaptionTopic = 'ship' | 'dp' | 'docs' | 'demurrage';

const CAPTION_TRANSLATION_TEXT: Record<CaptionTopic, Record<DesktopActiveTargetLanguage, string>> = {
  ship: {
    en: "Next week's vessel schedule is still waiting for port confirmation.",
    zh: '下周船期还在等港口确认。',
    id: 'Jadwal kapal minggu depan masih menunggu konfirmasi dari pelabuhan.',
    ms: 'Jadual kapal minggu depan masih menunggu pengesahan daripada pelabuhan.',
    th: 'ตารางเรือสัปดาห์หน้ายังรอการยืนยันจากท่าเรือ',
    vi: 'Lịch tàu tuần tới vẫn đang chờ xác nhận từ cảng.',
    fil: 'Naghihintay pa ng kumpirmasyon mula sa daungan ang iskedyul ng barko sa susunod na linggo.',
    my: 'လာမည့်အပတ် သင်္ဘောအချိန်ဇယားသည် ဆိပ်ကမ်း၏ အတည်ပြုချက်ကို စောင့်နေဆဲဖြစ်သည်။',
    km: 'កាលវិភាគនាវាសប្ដាហ៍ក្រោយកំពុងរង់ចាំការបញ្ជាក់ពីកំពង់ផែ។',
    lo: 'ຕາຕະລາງເຮືອອາທິດໜ້າຍັງລໍຖ້າການຢືນຢັນຈາກທ່າເຮືອ.',
    ja: '来週の船便スケジュールは、まだ港からの確認待ちです。',
    ko: '다음 주 선박 일정은 아직 항구의 확인을 기다리고 있습니다.',
    es: 'El calendario del buque de la próxima semana aún espera la confirmación del puerto.',
    fr: 'Le planning du navire de la semaine prochaine attend encore la confirmation du port.',
    de: 'Der Schiffsplan für nächste Woche wartet noch auf die Bestätigung des Hafens.',
    ar: 'ما زال جدول السفينة للأسبوع المقبل ينتظر تأكيد الميناء.',
    hi: 'अगले सप्ताह का जहाज कार्यक्रम अभी बंदरगाह की पुष्टि की प्रतीक्षा कर रहा है।',
    pt: 'A programação do navio da próxima semana ainda aguarda confirmação do porto.',
  },
  dp: {
    en: 'If the deposit arrives today, we can hold the shipping slot for you.',
    zh: '如果今天定金到账，我们可以为你们保留发货舱位。',
    id: 'Kalau DP sudah masuk hari ini, kami bisa tahan slot pengiriman untuk Anda.',
    ms: 'Jika deposit diterima hari ini, kami boleh menahan slot penghantaran untuk anda.',
    th: 'หากเงินมัดจำเข้าวันนี้ เราจะกันพื้นที่จัดส่งไว้ให้คุณได้',
    vi: 'Nếu tiền đặt cọc về hôm nay, chúng tôi có thể giữ chỗ giao hàng cho bạn.',
    fil: 'Kung pumasok ang deposito ngayong araw, maaari naming ireserba ang slot ng pagpapadala para sa inyo.',
    my: 'ယနေ့ စပေါ်ငွေဝင်ပါက သင့်အတွက် ပို့ဆောင်ရေးနေရာကို ထိန်းထားနိုင်ပါသည်။',
    km: 'ប្រសិនបើប្រាក់កក់ចូលថ្ងៃនេះ យើងអាចរក្សាកន្លែងដឹកជញ្ជូនសម្រាប់អ្នកបាន។',
    lo: 'ຖ້າເງິນມັດຈຳເຂົ້າມື້ນີ້ ພວກເຮົາສາມາດຈອງຊ່ອງຂົນສົ່ງໃຫ້ທ່ານໄດ້.',
    ja: '本日デポジットの入金が確認できれば、出荷枠を確保できます。',
    ko: '오늘 계약금이 입금되면 배송 슬롯을 확보해 드릴 수 있습니다.',
    es: 'Si el depósito llega hoy, podemos reservarles el espacio de envío.',
    fr: "Si l'acompte arrive aujourd'hui, nous pouvons réserver le créneau d'expédition.",
    de: 'Wenn die Anzahlung heute eingeht, können wir den Versandplatz für Sie reservieren.',
    ar: 'إذا وصل العربون اليوم، يمكننا حجز خانة الشحن لكم.',
    hi: 'यदि आज जमा राशि आ जाती है, तो हम आपके लिए शिपिंग स्लॉट रोक सकते हैं।',
    pt: 'Se o depósito entrar hoje, podemos reservar o espaço de envio para vocês.',
  },
  docs: {
    en: 'Please make sure the invoice and packing list are sent before 5 p.m.',
    zh: '请确认发票和装箱单在下午五点前发出。',
    id: 'Tolong pastikan invoice dan packing list dikirim sebelum jam lima sore.',
    ms: 'Sila pastikan invois dan senarai pembungkusan dihantar sebelum jam lima petang.',
    th: 'โปรดยืนยันว่าใบแจ้งหนี้และแพ็กกิ้งลิสต์จะถูกส่งก่อนห้าโมงเย็น',
    vi: 'Vui lòng đảm bảo hóa đơn và phiếu đóng gói được gửi trước 5 giờ chiều.',
    fil: 'Pakisiguro na maipapadala ang invoice at packing list bago mag-alas singko ng hapon.',
    my: 'ကျေးဇူးပြု၍ ညနေ ၅ နာရီမတိုင်မီ invoice နှင့် packing list ပို့ကြောင်း အတည်ပြုပေးပါ။',
    km: 'សូមបញ្ជាក់ថាវិក្កយបត្រ និងបញ្ជីវេចខ្ចប់ត្រូវបានផ្ញើមុនម៉ោងប្រាំល្ងាច។',
    lo: 'ກະລຸນາຢືນຢັນວ່າໃບແຈ້ງໜີ້ ແລະ packing list ຈະຖືກສົ່ງກ່ອນ 5 ໂມງແລງ.',
    ja: '請求書とパッキングリストを午後5時までに送付してください。',
    ko: '송장과 포장 명세서가 오후 5시 전에 발송되는지 확인해 주세요.',
    es: 'Por favor confirme que la factura y la lista de empaque se envíen antes de las cinco de la tarde.',
    fr: "Veuillez confirmer que la facture et la liste de colisage seront envoyées avant 17 h.",
    de: 'Bitte bestätigen Sie, dass Rechnung und Packliste vor 17 Uhr gesendet werden.',
    ar: 'يرجى التأكد من إرسال الفاتورة وقائمة التعبئة قبل الساعة الخامسة مساءً.',
    hi: 'कृपया सुनिश्चित करें कि इनवॉइस और पैकिंग सूची शाम पाँच बजे से पहले भेज दी जाए।',
    pt: 'Confirme que a fatura e o packing list sejam enviados antes das cinco da tarde.',
  },
  demurrage: {
    en: 'For demurrage, the party that delays the documents will bear the cost.',
    zh: '关于滞港费，由延误处理单据的一方承担。',
    id: 'Untuk biaya demurrage, pihak yang terlambat mengurus dokumen yang menanggung.',
    ms: 'Untuk kos demurrage, pihak yang lewat mengurus dokumen akan menanggungnya.',
    th: 'สำหรับค่าธรรมเนียมล่าช้า ฝ่ายที่ดำเนินเอกสารล่าช้าจะเป็นผู้รับผิดชอบ',
    vi: 'Về phí lưu bãi, bên chậm xử lý chứng từ sẽ chịu chi phí.',
    fil: 'Para sa demurrage, ang panig na naantala sa pag-aayos ng mga dokumento ang sasagot sa gastos.',
    my: 'Demurrage အခကြေးငွေအတွက် စာရွက်စာတမ်းလုပ်ဆောင်မှု နောက်ကျသည့်ဘက်က ကျခံရပါမည်။',
    km: 'សម្រាប់ថ្លៃ demurrage ភាគីដែលពន្យារពេលរៀបចំឯកសារត្រូវទទួលខុសត្រូវ។',
    lo: 'ສໍາລັບຄ່າ demurrage ຝ່າຍທີ່ຈັດການເອກະສານຊ້າຈະເປັນຜູ້ຮັບຜິດຊອບ.',
    ja: '滞船料については、書類処理が遅れた側が負担します。',
    ko: '체선료는 서류 처리가 지연된 쪽이 부담합니다.',
    es: 'En cuanto a la demora, la parte que retrase los documentos asumirá el costo.',
    fr: 'Pour les frais de surestarie, la partie qui retarde les documents en assumera le coût.',
    de: 'Bei Liegegeld trägt die Partei die Kosten, die die Dokumente verzögert bearbeitet.',
    ar: 'بالنسبة لرسوم التأخير، يتحمل التكلفة الطرف الذي يتأخر في معالجة المستندات.',
    hi: 'डेमरेज शुल्क के लिए, दस्तावेज़ों में देरी करने वाला पक्ष लागत वहन करेगा।',
    pt: 'Quanto à demurrage, a parte que atrasar os documentos arcará com o custo.',
  },
};

function captionTopic(originalText: string, translatedText: string): CaptionTopic {
  const text = `${originalText} ${translatedText}`;
  if (/DP|定金|deposit/i.test(text)) return 'dp';
  if (/invoice|packing list|发票|装箱单/i.test(text)) return 'docs';
  if (/demurrage|滞港费/i.test(text)) return 'demurrage';
  return 'ship';
}

export function buildDesktopCaptionTranslations(
  originalText: string,
  translatedText: string,
  targetLanguages: DesktopTargetLanguage[] | undefined,
) {
  const topic = captionTopic(originalText, translatedText);
  return activeDesktopTargetLanguages(targetLanguages).map((targetLanguage) => ({
    targetLanguage,
    label: desktopTargetLanguageLabel(targetLanguage),
    translatedText: CAPTION_TRANSLATION_TEXT[topic][targetLanguage],
  }));
}

export interface KnowlyDesktopApi {
  getRuntimeInfo: () => Promise<DesktopRuntimeInfo>;
  showOverlay: () => Promise<CaptionOverlaySettings>;
  hideOverlay: () => Promise<CaptionOverlaySettings>;
  getOverlaySettings: () => Promise<CaptionOverlaySettings>;
  setOverlaySettings: (settings: Partial<CaptionOverlaySettings>) => Promise<CaptionOverlaySettings>;
  toggleOverlayFullscreen: () => Promise<CaptionOverlaySettings>;
  startCaptionMockStream: (options: StartCaptionStreamOptions) => Promise<CaptionStreamState>;
  pauseCaptionMockStream: () => Promise<CaptionStreamState>;
  resumeCaptionMockStream: () => Promise<CaptionStreamState>;
  stopCaptionMockStream: () => Promise<CaptionStreamState>;
  getCaptionStreamState: () => Promise<CaptionStreamState>;
  onCaptionLine: (callback: (line: DesktopCaptionLine) => void) => () => void;
  onCaptionState: (callback: (state: CaptionStreamState) => void) => () => void;
  onCaptionLanguageStates: (callback: (states: DesktopCaptionLanguageState[]) => void) => () => void;
  onOverlaySettings: (callback: (settings: CaptionOverlaySettings) => void) => () => void;
}
