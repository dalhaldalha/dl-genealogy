import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMemberSchema } from '@kinfolk/shared';
import type { FamilyMember, ParentChild } from '@kinfolk/shared';
import { X, UserCog, Upload, Trash2, RefreshCw } from 'lucide-react';
import { processImageFile } from '@/lib/images/process-image';
import { getDescendantIds } from '@/lib/layout/generation-assigner';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onDelete?: (id: string) => void;
  initialData: FamilyMember | null;
  allMembers: FamilyMember[];
  parentChildEdges?: ParentChild[];
  initialSpouseId?: string | null;
  initialFatherId?: string | null;
  initialMotherId?: string | null;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  allMembers,
  parentChildEdges = [],
  initialSpouseId,
  initialFatherId,
  initialMotherId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      maidenName: '',
      branch: 'paternal' as 'paternal' | 'maternal',
      gender: 'male' as 'male' | 'female',
      dateOfBirth: '',
      isDeceased: false,
      dateOfDeath: '',
      profession: '',
      residence: '',
      avatarUrl: '',
      bio: '',
      spouseId: '',
      fatherId: '',
      motherId: '',
    },
  });

  // Re-synchronize form state whenever the modal opens or the target member changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          maidenName: initialData.maidenName || '',
          branch: (initialData.branch as 'paternal' | 'maternal') || 'paternal',
          gender: initialData.gender === 'female' ? 'female' : 'male',
          dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
          isDeceased: Boolean(initialData.isDeceased),
          dateOfDeath: initialData.dateOfDeath ? initialData.dateOfDeath.split('T')[0] : '',
          profession: initialData.profession || '',
          residence: initialData.residence || '',
          avatarUrl: initialData.avatarUrl || '',
          bio: initialData.bio || '',
          spouseId: initialSpouseId || '',
          fatherId: initialFatherId || '',
          motherId: initialMotherId || '',
        });
      } else {
        reset({
          firstName: '',
          lastName: '',
          maidenName: '',
          branch: 'paternal',
          gender: 'male',
          dateOfBirth: '',
          isDeceased: false,
          dateOfDeath: '',
          profession: '',
          residence: '',
          avatarUrl: '',
          bio: '',
          spouseId: '',
          fatherId: initialFatherId || '',
          motherId: initialMotherId || '',
        });
      }
      setUploadError(null);
      setIsUploading(false);
      setIsDragOver(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, initialData, initialSpouseId, initialFatherId, initialMotherId, reset]);

  const isDeceased = watch('isDeceased');
  const avatarUrl = watch('avatarUrl');

  const handleFile = async (file: File) => {
    if (!file) return;
    try {
      setUploadError(null);
      setIsUploading(true);
      const dataUrl = await processImageFile(file);
      setValue('avatarUrl', dataUrl, { shouldValidate: true, shouldDirty: true });
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to process image file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveAvatar = () => {
    setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true });
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  // Filter out the currently edited member and all their descendants from parent options to prevent ancestral cycles
  const descendantIds = initialData?.id && parentChildEdges.length > 0
    ? getDescendantIds(initialData.id, parentChildEdges)
    : new Set<string>();

  const eligibleMembers = allMembers.filter((m) => !initialData?.id || m.id !== initialData.id);
  const eligibleParents = eligibleMembers.filter((m) => !descendantIds.has(m.id));

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-heritage-gold/20 text-heritage-gold flex items-center justify-center shrink-0">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                {initialData?.id ? 'Edit Ancestor Profile' : 'Add Family Member'}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400">Expand the DL-Genealogy archive</p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            onClick={onClose}
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                First Name *
              </label>
              <input
                {...register('firstName')}
                placeholder="Eleanor"
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all"
              />
              {errors.firstName && (
                <span className="text-[10px] text-rose-500 mt-0.5 block">
                  {errors.firstName.message as string}
                </span>
              )}
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Last Name *
              </label>
              <input
                {...register('lastName')}
                placeholder="Vance"
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all"
              />
              {errors.lastName && (
                <span className="text-[10px] text-rose-500 mt-0.5 block">
                  {errors.lastName.message as string}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Maiden / Alternate Name
              </label>
              <input
                {...register('maidenName')}
                placeholder="née Montgomery"
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Branch / Side
              </label>
              <select
                {...register('branch')}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all"
              >
                <option value="paternal">Paternal</option>
                <option value="maternal">Maternal</option>
              </select>
            </div>
          </div>

          {/* Lifespan & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                {...register('dateOfBirth')}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all"
              />
              {errors.dateOfBirth && (
                <span className="text-[10px] text-rose-500 mt-0.5 block">
                  {errors.dateOfBirth.message as string}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Is Deceased?</label>
                <input
                  type="checkbox"
                  {...register('isDeceased')}
                  className="rounded border-zinc-300 text-heritage-gold focus:ring-heritage-gold"
                />
              </div>
              <input
                type="date"
                {...register('dateOfDeath')}
                disabled={!isDeceased}
                className={`w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all ${
                  !isDeceased ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              {errors.dateOfDeath && (
                <span className="text-[10px] text-rose-500 mt-0.5 block">
                  {errors.dateOfDeath.message as string}
                </span>
              )}
            </div>
          </div>

          {/* Profession & Residence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Profession / Title
              </label>
              <input
                {...register('profession')}
                placeholder="Architectural Historian"
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Location / Residence
              </label>
              <input
                {...register('residence')}
                placeholder="London, United Kingdom"
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all"
              />
            </div>
          </div>

          {/* Ancestor Portrait (Direct Device Upload) */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 text-xs sm:text-sm">
              Ancestor Portrait
            </label>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            {avatarUrl ? (
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden ring-2 ring-heritage-gold/50 shadow-md shrink-0 bg-zinc-800">
                  <img
                    src={avatarUrl}
                    alt="Ancestor portrait preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    Portrait attached from device
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Ready to save with archive record
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                      Change Photo
                    </button>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                  isDragOver
                    ? 'border-heritage-gold bg-heritage-gold/10'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-heritage-gold/70 dark:hover:border-heritage-gold/70 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-heritage-gold/5'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-heritage-gold/10 text-heritage-gold flex items-center justify-center">
                  <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {isUploading ? 'Processing portrait...' : 'Upload portrait from device'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Click to browse files or drag & drop (PNG, JPG, WebP)
                  </p>
                </div>
              </div>
            )}

            {uploadError && (
              <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                {uploadError}
              </span>
            )}
            {errors.avatarUrl && (
              <span className="text-[10px] text-rose-500 mt-0.5 block">
                {errors.avatarUrl.message as string}
              </span>
            )}
          </div>

          {/* Lineage Relational Linkages */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2.5 sm:space-y-3">
            <span className="font-bold text-zinc-600 dark:text-zinc-300 block text-[11px] uppercase tracking-wider">
              Lineage Relational Linkages
            </span>

            {/* Gender & Spouse row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-zinc-500 mb-1 text-[11px]">Gender</label>
                <select
                  {...register('gender')}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1 text-[11px]">Spouse (Optional)</label>
                <select
                  {...register('spouseId')}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="">None / Unlinked</option>
                  {eligibleMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} (Gen {m.generation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Father & Mother row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-zinc-500 mb-1 text-[11px]">Father (Optional)</label>
                <select
                  {...register('fatherId')}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="">No Father Linked</option>
                  {eligibleParents
                    .filter((m) => m.gender === 'male' || (m.gender as string) !== 'female')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} (Gen {m.generation})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1 text-[11px]">Mother (Optional)</label>
                <select
                  {...register('motherId')}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="">No Mother Linked</option>
                  {eligibleParents
                    .filter((m) => m.gender === 'female')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} (Gen {m.generation})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bio / Historical Memoir */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Bio / Historical Memoir
            </label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Notable achievements, childhood memories, passions..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-heritage-gold transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {initialData?.id && (
              <button
                type="button"
                onClick={() => onDelete?.(initialData.id)}
                className="px-3.5 py-2 text-rose-500 hover:bg-rose-500/10 rounded-xl font-semibold transition-all text-center"
              >
                Delete Member
              </button>
            )}
            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 font-semibold transition-all text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-heritage-gold hover:bg-heritage-goldHover text-zinc-950 font-bold transition-all shadow-md text-center"
              >
                Save Ancestor
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
