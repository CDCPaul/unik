'use client';

import { useEffect, useState } from 'react';
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
import type { BusinessCard } from '@unik/shared/types';

type DraftCard = Partial<BusinessCard> & { _originalSlug?: string };

const emptyDraft = (): DraftCard => ({
  slug: '',
  name: '',
  nameEn: '',
  department: '',
  title: '',
  phone: '',
  email: '',
  photoUrl: '',
  isActive: true,
  order: 0,
});

export default function BusinessCardsAdminPage() {
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
      alert('Failed to load business cards');
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
      alert('Slug는 영문 소문자 / 숫자 / 하이픈만 사용 가능합니다 (2~40자).');
      return;
    }
    if (!draft.name?.trim()) {
      alert('이름은 필수 입력 항목입니다.');
      return;
    }
    if (!draft.phone?.trim()) {
      alert('휴대폰 번호는 필수 입력 항목입니다.');
      return;
    }
    if (!draft.email?.trim()) {
      alert('이메일은 필수 입력 항목입니다.');
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
        email: draft.email.trim(),
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
      alert(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(card: BusinessCard) {
    if (!confirm(`"${card.name}" 명함을 삭제할까요? URL(${card.slug})도 함께 사라집니다.`)) {
      return;
    }
    try {
      await deleteBusinessCard(card.slug);
      await reload();
    } catch (error) {
      console.error(error);
      alert('Failed to delete');
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft?.slug) {
      if (!draft?.slug) alert('사진 업로드 전에 Slug를 먼저 입력해주세요.');
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadBusinessCardPhoto(file, draft.slug);
      setDraft({ ...draft, photoUrl: url });
    } catch (error) {
      console.error(error);
      alert('Failed to upload photo');
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
      window.prompt('Copy this URL:', url);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Cards</h1>
          <p className="text-slate-500 mt-1">
            NFC 모바일 명함 — <code className="text-xs">/profile/{'{slug}'}</code>
          </p>
        </div>
        <button onClick={handleAdd} className="admin-btn-primary">
          <Plus className="w-4 h-4" />
          명함 추가
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
          <p className="text-slate-500">아직 등록된 명함이 없습니다.</p>
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
                  <img
                    src={card.photoUrl}
                    alt={card.name}
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
                        비활성
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
                  title="URL 복사"
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
                  미리보기
                </a>
                <button
                  onClick={() => handleEdit(card)}
                  className="admin-btn-secondary text-xs py-2"
                >
                  <Edit className="w-3 h-3" />
                  수정
                </button>
                <button
                  onClick={() => handleDelete(card)}
                  className="inline-flex items-center justify-center gap-1 text-xs py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  삭제
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
                  {draft._originalSlug ? '명함 수정' : '명함 추가'}
                </h2>
                <button
                  onClick={() => setDraft(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Slug */}
              <Field
                label="URL Slug *"
                hint="예: gildong-hong → /profile/gildong-hong"
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
              <Field label="프로필 사진" hint="선택. JPG/PNG 권장 600x600">
                <div className="flex items-center gap-4">
                  {draft.photoUrl ? (
                    <img
                      src={draft.photoUrl}
                      alt="profile"
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
                        업로드 중...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        사진 업로드
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
                      제거
                    </button>
                  )}
                </div>
              </Field>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="이름 *">
                  <input
                    className="admin-input"
                    value={draft.name ?? ''}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="홍길동"
                  />
                </Field>
                <Field label="영문 이름" hint="선택, vCard 보조 표시용">
                  <input
                    className="admin-input"
                    value={draft.nameEn ?? ''}
                    onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                    placeholder="Gildong Hong"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="부서" hint="선택">
                  <input
                    className="admin-input"
                    value={draft.department ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, department: e.target.value })
                    }
                    placeholder="영업팀"
                  />
                </Field>
                <Field label="직함" hint="선택">
                  <input
                    className="admin-input"
                    value={draft.title ?? ''}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="대리"
                  />
                </Field>
              </div>

              <Field
                label="휴대폰 *"
                hint="회사 대표 사무실 전화는 모든 명함에 자동 표시됩니다 (lib/businessCardConfig.ts)"
              >
                <input
                  className="admin-input"
                  type="tel"
                  value={draft.phone ?? ''}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="+63-917-123-4567"
                />
              </Field>

              <Field label="이메일 *">
                <input
                  className="admin-input"
                  type="email"
                  value={draft.email ?? ''}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="name@cebudirectclub.com"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="정렬 순서" hint="작은 숫자가 위에 표시">
                  <input
                    className="admin-input"
                    type="number"
                    value={draft.order ?? 0}
                    onChange={(e) =>
                      setDraft({ ...draft, order: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="활성 상태" hint="비활성 시 /profile 페이지 접근 차단">
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={draft.isActive ?? true}
                      onChange={(e) =>
                        setDraft({ ...draft, isActive: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-blue-600"
                    />
                    <span className="text-sm text-slate-700">활성화</span>
                  </label>
                </Field>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 sticky bottom-0 bg-white flex justify-end gap-2">
              <button onClick={() => setDraft(null)} className="admin-btn-secondary">
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="admin-btn-primary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장'
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
