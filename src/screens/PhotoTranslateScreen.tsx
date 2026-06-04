import { AlertCircle, Camera, CheckCircle2, Copy, Images, Loader2, Plus, RotateCcw, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { PhotoTranslateResult, KnowlyService } from '@/services/knowlyService';
import type { TermEntry } from '@/types';

type RecognitionPhase = 'empty' | 'scanning' | 'done' | 'error';

interface SelectedPhoto {
  previewUrl: string;
  name: string;
}

interface PhotoTranslateScreenProps {
  service: KnowlyService;
  initialPhotoPreviewUrl?: string;
  initialPhotoName?: string;
  onBack: () => void;
  onAddTerm: (term: TermEntry) => void;
}

const PHASE_LABEL: Record<RecognitionPhase, string> = {
  empty: '等待拍摄',
  scanning: '识别翻译中',
  done: '识别完成',
  error: '识别失败',
};

export function PhotoTranslateScreen({ service, initialPhotoPreviewUrl, initialPhotoName, onBack, onAddTerm }: PhotoTranslateScreenProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const ownedPhotoUrlRef = useRef(initialPhotoPreviewUrl ?? '');
  const [photo, setPhoto] = useState<SelectedPhoto | null>(() => (
    initialPhotoPreviewUrl ? { previewUrl: initialPhotoPreviewUrl, name: initialPhotoName ?? '现场照片' } : null
  ));
  const [result, setResult] = useState<PhotoTranslateResult | null>(null);
  const [phase, setPhase] = useState<RecognitionPhase>(initialPhotoPreviewUrl ? 'scanning' : 'empty');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (ownedPhotoUrlRef.current) URL.revokeObjectURL(ownedPhotoUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!photo) {
      setResult(null);
      setPhase('empty');
      setError('');
      return;
    }

    let mounted = true;
    setPhase('scanning');
    setResult(null);
    setError('');

    service.translatePhoto()
      .then((data) => {
        if (!mounted) return;
        setResult(data);
        setPhase('done');
      })
      .catch(() => {
        if (!mounted) return;
        setError('照片识别没有完成，请重新拍摄或换一张更清晰的图片。');
        setPhase('error');
      });

    return () => {
      mounted = false;
    };
  }, [photo, service]);

  function openCamera() {
    const input = cameraInputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
  }

  function openGallery() {
    const input = galleryInputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
  }

  function updatePhoto(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件。');
      setPhase('error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (ownedPhotoUrlRef.current) URL.revokeObjectURL(ownedPhotoUrlRef.current);
    ownedPhotoUrlRef.current = previewUrl;
    setCopied(false);
    setPhoto({ previewUrl, name: file.name || '现场照片' });
  }

  function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updatePhoto(file);
    event.target.value = '';
  }

  function copyTranslatedText() {
    if (!result) return;
    void navigator.clipboard?.writeText(result.translated.join('\n')).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  const statusIcon = phase === 'scanning'
    ? <Loader2 className="w-4 h-4 animate-spin" />
    : phase === 'done'
      ? <CheckCircle2 className="w-4 h-4" />
      : phase === 'error'
        ? <AlertCircle className="w-4 h-4" />
      : <Camera className="w-4 h-4" />;
  const subtitle = !photo
    ? '文件、图纸、菜单和路牌'
    : phase === 'done'
      ? '现场图片已翻译'
      : phase === 'error'
        ? '请重新拍摄或导入'
        : '现场图片识别中';

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader title="拍照翻译" subtitle={subtitle} onBack={onBack} />

      <div className="p-4 space-y-4">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelected}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelected}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="relative h-64 rounded-2xl bg-slate-950 text-white overflow-hidden">
            {photo ? (
              <img src={photo.previewUrl} alt="待翻译照片预览" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <Camera className="w-11 h-11 text-blue-200" />
                <div className="text-center">
                  <p className="font-semibold">准备拍照识别</p>
                  <p className="text-xs text-slate-300 mt-1">文件 · 菜单 · 图纸 · 路牌</p>
                </div>
              </div>
            )}

            <div className="absolute left-3 top-3 min-h-9 px-3 rounded-full bg-black/55 backdrop-blur-sm text-xs font-semibold flex items-center gap-2">
              {statusIcon}
              {PHASE_LABEL[phase]}
            </div>

            {photo && (
              <div className="absolute left-3 right-3 bottom-3 rounded-xl bg-black/60 backdrop-blur-sm px-3 py-2">
                <p className="text-sm font-semibold truncate">{result ? result.title : photo.name}</p>
                <p className="text-xs text-slate-200 mt-0.5">{result ? result.sourceType : '原图已就绪'}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openCamera}
              className="min-h-11 rounded-2xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 active:bg-blue-700"
            >
              {photo ? <RotateCcw className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {photo ? '重新拍照' : '打开相机'}
            </button>
            <button
              type="button"
              onClick={openGallery}
              className="min-h-11 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 active:bg-gray-50"
            >
              <Images className="w-4 h-4" />
              相册导入
            </button>
          </div>
          <div className="min-h-10 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2">
            <Wand2 className="w-4 h-4" />
            自动校对已开启
          </div>
        </section>

        {phase === 'empty' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center text-sm text-gray-500">等待照片</div>
        )}

        {phase === 'scanning' && (
          <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              OCR 正在识别
            </div>
            {[0, 1, 2].map((item) => (
              <div key={item} className="space-y-2 animate-pulse">
                <div className="h-3 w-20 rounded-full bg-gray-200" />
                <div className="h-3 w-full rounded-full bg-gray-100" />
                <div className="h-3 w-4/5 rounded-full bg-blue-100" />
              </div>
            ))}
          </section>
        )}

        {phase === 'error' && (
          <section className="bg-white border border-red-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-red-700">
              <AlertCircle className="w-4 h-4" />
              识别失败
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{error || '照片识别没有完成。'}</p>
            <button
              type="button"
              onClick={openCamera}
              className="min-h-11 w-full rounded-2xl bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              重新拍摄
            </button>
          </section>
        )}

        {phase === 'done' && result && (
          <>
            <section className="grid grid-cols-1 gap-3">
              {result.original.map((line, index) => (
                <div key={line} className="bg-white border border-gray-200 rounded-2xl p-3">
                  <p className="text-xs font-medium text-gray-500">原文 {index + 1}</p>
                  <p className="text-sm text-gray-900 mt-1">{line}</p>
                  <p className="text-xs font-medium text-blue-600 mt-3">译文</p>
                  <p className="text-sm text-gray-950 mt-1">{result.translated[index]}</p>
                </div>
              ))}
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-gray-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                术语命中
              </div>
              <div className="flex flex-wrap gap-2">
                {result.terms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => onAddTerm({
                      id: `photo-${term}-${Date.now()}`,
                      zh: term,
                      idText: term,
                      category: '拍照翻译',
                      note: '从拍照翻译加入',
                      source: 'session',
                      createdAt: new Date().toISOString(),
                    })}
                    className="min-h-9 px-2.5 rounded-2xl bg-gray-100 text-xs font-medium text-gray-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {term}
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={copyTranslatedText}
              className="min-h-12 w-full rounded-2xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? '已复制译文' : '复制全部译文'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
