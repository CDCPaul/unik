'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Edit,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Upload,
  UserCircle2,
  X,
  Copy,
  Check,
} from 'lucide-react';
import {
  createBusinessCard,
  deleteBusinessCard,
  isValidSlug,
  listBusinessCards,
  renameBusinessCardSlug,
  updateBusinessCard,
  uploadBusinessCardPhoto,
  type BusinessCardInput,
} from '@/lib/services/admin/businessCards';
import { COMPANY_INFO } from '@/lib/businessCardConfig';
import type { BusinessCard } from '@unik/shared/types';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import type { TFunction } from '@/lib/admin/i18n/translate';

// 서비스가 던지는 영어 오류 중 직원이 마주칠 수 있는 것만 번역한다 (그 외는 원문 그대로)
const SLUG_EXISTS = /^Slug "(.+)" already exists\.$/;
function saveErrorText(error: unknown, t: TFunction): string {
  if (!(error instanceof Error)) return t('cards.saveFailed');
  const slug = SLUG_EXISTS.exec(error.message)?.[1];
  return slug ? t('cards.error.slugExists', { slug }) : error.message;
}

type DraftCard = Partial<BusinessCard> & { _originalSlug?: string };

const emptyDraft = (): DraftCard => ({
  slug: '',
  name: '',
  nameEn: '',
  department: '',
  title: '',
  phone: '',
  kakaoId: '',
  email: '',
  // 사무실 정보는 회사 공통값을 기본으로 깔아두고, 필요한 직원만 개별 수정한다.
  officePhone: COMPANY_INFO.officePhone,
  officeAddress: COMPANY_INFO.address,
  photoUrl: '',
  isActive: true,
  order: 0,
});

export default function BusinessCardsAdminPage() {
  const { t } = useAdminT();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<DraftCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    setIsLoading(true);
    try {
      setCards(await listBusinessCards());
    } catch (error) {
      console.error(error);
      alert(t('cards.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  function handleAdd() {
    setDraft({ ...emptyDraft(), order: cards.length });
  }

  function handleEdit(card: BusinessCard) {
    setDraft({ ...card, _originalSlug: card.slug });
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.slug || !isValidSlug(draft.slug)) {
      alert(t('cards.error.slug'));
      return;
    }
    if (!draft.name?.trim()) {
      alert(t('cards.error.name'));
      return;
    }
    if (!draft.phone?.trim()) {
      alert(t('cards.error.phone'));
      return;
    }
    if (!draft.email?.trim()) {
      alert(t('cards.error.email'));
      return;
    }

    setIsSaving(true);
    try {
      const original = draft._originalSlug;
      const payload: BusinessCardInput = {
        slug: draft.slug,
        name: draft.name.trim(),
        nameEn: draft.nameEn?.trim() || undefined,
        familyName: draft.familyName?.trim() || undefined,
        givenName: draft.givenName?.trim() || undefined,
        department: draft.department?.trim() || undefined,
        title: draft.title?.trim() || undefined,
        phone: draft.phone.trim(),
        kakaoId: draft.kakaoId?.trim() || undefined,
        email: draft.email.trim(),
        officePhone: draft.officePhone?.trim() || undefined,
        officeAddress: draft.officeAddress?.trim() || undefined,
        photoUrl: draft.photoUrl || undefined,
        isActive: draft.isActive ?? true,
        order: draft.order ?? 0,
      };

      if (!original) {
        await createBusinessCard(payload);
      } else if (original !== payload.slug) {
        // slug 변경: 새 doc 생성 → 정보 업데이트 → 기존 삭제
        await renameBusinessCardSlug(original, payload.slug);
        const { slug: _ignore, ...patch } = payload;
        await updateBusinessCard(payload.slug, patch);
      } else {
        const { slug: _ignore, ...patch } = payload;
        await updateBusinessCard(payload.slug, patch);
      }

      await reload();
      setDraft(null);
    } catch (error) {
      console.error(error);
      alert(saveErrorText(error, t));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(card: BusinessCard) {
    if (!confirm(t('cards.deleteConfirm', { name: card.name, slug: card.slug }))) {
      return;
    }
    try {
      await deleteBusinessCard(card.slug);
      await reload();
    } catch (error) {
      console.error(error);
      alert(t('cards.deleteFailed'));
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft?.slug) {
      if (!draft?.slug) alert(t('cards.error.slugBeforePhoto'));
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadBusinessCardPhoto(file, draft.slug);
      setDraft({ ...draft, photoUrl: url });
    } catch (error) {
      console.error(error);
      alert(t('cards.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  }

  async function copyProfileUrl(slug: string) {
    const url = `${window.location.origin}/profile/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug((curr) => (curr === slug ? null : curr)), 1500);
    } catch {
      window.prompt(t('cards.copyUrlPrompt'), url);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.businessCards')}</h1>
          <p className="text-slate-500 mt-1">
            {t('cards.subtitle')} <code className="text-xs">/profile/{'{slug}'}</code>
          </p>
        </div>
        <button onClick={handleAdd} className="admin-btn-primary">
          <Plus className="w-4 h-4" />
          {t('cards.add')}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : cards.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <UserCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t('cards.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="admin-card p-5"
            >
              <div className="flex gap-4">
                {card.photoUrl ? (
                  // next/image 를 거쳐 64px 썸네일만 받는다.
                  // 원본은 카메라 해상도(1MB+)라 raw <img> 로 두면 목록 한 번 여는 데
                  // 인원수 x 1MB 를 그대로 내려받게 된다.
                  <Image
                    src={card.photoUrl}
                    alt={card.name}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="w-16 h-16 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 shrink-0">
                    {card.name.slice(0, 1) || '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 truncate">{card.name}</h3>
                    {!card.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {t('cards.inactive')}
                      </span>
                    )}
                  </div>
                  {(card.department || card.title) && (
                    <p className="text-xs text-slate-500 truncate">
                      {[card.department, card.title].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1 truncate">{card.email}</p>
                  <p className="text-xs text-slate-400 truncate">{card.phone}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                <code className="px-2 py-1 bg-slate-100 rounded text-slate-600 truncate">
                  /profile/{card.slug}
                </code>
                <button
                  onClick={() => copyProfileUrl(card.slug)}
                  className="text-slate-500 hover:text-blue-600 transition-colors shrink-0"
                  title={t('cards.copyUrl')}
                  aria-label={t('cards.copyUrl')}
                >
                  {copiedSlug === card.slug ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <a
                  href={`/profile/${card.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn-secondary text-xs py-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t('cards.preview')}
                </a>
                <button
                  onClick={() => handleEdit(card)}
                  className="admin-btn-secondary text-xs py-2"
                >
                  <Edit className="w-3 h-3" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(card)}
                  className="inline-flex items-center justify-center gap-1 text-xs py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  {t('common.delete')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {draft && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {draft._originalSlug ? t('cards.editTitle') : t('cards.add')}
                </h2>
                <button
                  onClick={() => setDraft(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Slug */}
              <Field
                label={t('cards.field.slug')}
                hint={t('cards.field.slugHint')}
              >
                <input
                  className="admin-input"
                  value={draft.slug ?? ''}
                  onChange={(e) =>
                    setDraft({ ...draft, slug: e.target.value.toLowerCase() })
                  }
                  placeholder="gildong-hong"
                />
              </Field>

              {/* Photo */}
              <Field label={t('cards.field.photo')} hint={t('cards.field.photoHint')}>
                <div className="flex items-center gap-4">
                  {draft.photoUrl ? (
                    <Image
                      src={draft.photoUrl}
                      alt={t('cards.field.photoAlt')}
                      width={80}
                      height={80}
                      sizes="80px"
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                      <UserCircle2 className="w-10 h-10" />
                    </div>
                  )}
                  <label className="admin-btn-secondary cursor-pointer text-sm">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('cards.field.uploading')}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {t('cards.field.uploadPhoto')}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </label>
                  {draft.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, photoUrl: '' })}
                      className="text-xs text-red-500 hover:underline"
                    >
                      {t('cards.field.removePhoto')}
                    </button>
                  )}
                </div>
              </Field>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('cards.field.name')}>
                  <input
                    className="admin-input"
                    value={draft.name ?? ''}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="홍길동"
                  />
                </Field>
                <Field label={t('cards.field.nameEn')} hint={t('cards.field.nameEnHint')}>
                  <input
                    className="admin-input"
                    value={draft.nameEn ?? ''}
                    onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                    placeholder="Gildong Hong"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('cards.field.department')} hint={t('cards.field.optional')}>
                  <input
                    className="admin-input"
                    value={draft.department ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, department: e.target.value })
                    }
                    placeholder={t('cards.field.departmentPlaceholder')}
                  />
                </Field>
                <Field label={t('cards.field.title')} hint={t('cards.field.optional')}>
                  <input
                    className="admin-input"
                    value={draft.title ?? ''}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder={t('cards.field.titlePlaceholder')}
                  />
                </Field>
              </div>

              <Field
                label={t('cards.field.phone')}
                hint={t('cards.field.phoneHint')}
              >
                <input
                  className="admin-input"
                  type="tel"
                  value={draft.phone ?? ''}
                  onChange={(e) =>
                    setDraft({ ...draft, phone: e.target.value.replace(/-/g, '') })
                  }
                  placeholder="+63 917 123 4567"
                />
              </Field>

              <Field
                label={t('cards.field.kakao')}
                hint={t('cards.field.kakaoHint')}
              >
                <input
                  className="admin-input"
                  value={draft.kakaoId ?? ''}
                  onChange={(e) => setDraft({ ...draft, kakaoId: e.target.value.trim() })}
                  placeholder="cdc_gildong"
                />
              </Field>

              <Field label={t('cards.field.email')}>
                <input
                  className="admin-input"
                  type="email"
                  value={draft.email ?? ''}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="name@cebudirectclub.com"
                />
              </Field>

              <Field
                label={t('cards.field.officePhone')}
                hint={t('cards.field.officePhoneHint')}
              >
                <input
                  className="admin-input"
                  type="tel"
                  value={draft.officePhone ?? COMPANY_INFO.officePhone}
                  onChange={(e) =>
                    setDraft({ ...draft, officePhone: e.target.value.replace(/-/g, '') })
                  }
                  placeholder={COMPANY_INFO.officePhone}
                />
              </Field>

              <Field
                label={t('cards.field.officeAddress')}
                hint={t('cards.field.officeAddressHint')}
              >
                <textarea
                  className="admin-input min-h-[84px] resize-y"
                  value={draft.officeAddress ?? COMPANY_INFO.address}
                  onChange={(e) => setDraft({ ...draft, officeAddress: e.target.value })}
                  placeholder={COMPANY_INFO.address}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('cards.field.order')} hint={t('cards.field.orderHint')}>
                  <input
                    className="admin-input"
                    type="number"
                    value={draft.order ?? 0}
                    onChange={(e) =>
                      setDraft({ ...draft, order: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label={t('cards.field.active')} hint={t('cards.field.activeHint')}>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={draft.isActive ?? true}
                      onChange={(e) =>
                        setDraft({ ...draft, isActive: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-blue-600"
                    />
                    <span className="text-sm text-slate-700">{t('cards.field.activate')}</span>
                  </label>
                </Field>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 sticky bottom-0 bg-white flex justify-end gap-2">
              <button onClick={() => setDraft(null)} className="admin-btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="admin-btn-primary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('common.save')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
