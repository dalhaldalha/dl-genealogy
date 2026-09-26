import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TopNavBar } from './TopNavBar';
import { BottomHud } from './BottomHud';
import { CanvasContainer } from '../canvas/CanvasContainer';
import { SvgEdgeLayer } from '../canvas/SvgEdgeLayer';
import { GenerationBanner } from '../canvas/GenerationBanner';
import { MemberNodeCard } from '../nodes/MemberNodeCard';
import { SpotlightOverlay } from '../spotlight/SpotlightOverlay';
import { SpotlightDrawer } from '../spotlight/SpotlightDrawer';
import { RadarMiniMap } from '../radar/RadarMiniMap';
import { AdminFab } from '../admin/AdminFab';
import { MemberFormModal } from '../admin/MemberFormModal';
import { DeleteConfirmDialog } from '../admin/DeleteConfirmDialog';
import { AdminLoginModal } from '../auth/AdminLoginModal';
import { UserPlus } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useTreeStore } from '@/stores/tree-store';
import { useSpotlightStore } from '@/stores/spotlight-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTreeLayout } from '@/hooks/useTreeLayout';
import { emptyFamilyTree } from '@/data/mockTreeData';
import { fetchTree } from '@/api/trees';
import { createMember, updateMember, deleteMember } from '@/api/members';
import { deleteUnion } from '@/api/relationships';
import type { FamilyMember, FamilyTreeFull } from '@kinfolk/shared';
import {
  computeDynamicGenerations,
  getDynamicGenerationLabel,
} from '@/lib/layout/generation-assigner';

const STORAGE_KEY = 'dl_genealogy_tree_cache';

function loadCachedTree(): FamilyTreeFull | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.members) && parsed.members.length > 0) {
        return {
          id: parsed.id || 'tree_active',
          name: parsed.name || 'DL-GENEALOGY',
          subtitle: parsed.subtitle || null,
          createdAt: parsed.createdAt || new Date().toISOString(),
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          members: Array.isArray(parsed.members) ? parsed.members : [],
          parentChildEdges: Array.isArray(parsed.parentChildEdges) ? parsed.parentChildEdges : [],
          unions: Array.isArray(parsed.unions) ? parsed.unions : [],
          artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load tree from cache:', e);
  }
  return null;
}

function saveCachedTree(tree: FamilyTreeFull) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  } catch (e) {
    console.warn('Failed to save tree to cache:', e);
  }
}

export const AppShell: React.FC = () => {
  // Global stores
  const { translateX, translateY, scale, centerOnNode } = useCanvasStore();
  const { activeBranchFilter, setBranchFilter } = useTreeStore();
  const { focusedMemberId, isDrawerOpen, focusMember, closeFocus } = useSpotlightStore();
  const { role, setRole, isAdminToggleVisible, setIsAdminToggleVisible, setIsAdminModalOpen } = useAuthStore();

  // Local state for modals & editing relationships
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingSpouseId, setEditingSpouseId] = useState<string | null>(null);
  const [editingFatherId, setEditingFatherId] = useState<string | null>(null);
  const [editingMotherId, setEditingMotherId] = useState<string | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);

  // Tree data state (starts from local cache if present, filled by Supabase or user additions)
  const [treeState, setTreeState] = useState<FamilyTreeFull>(() => {
    return loadCachedTree() || emptyFamilyTree;
  });

  const { data: apiTree, isLoading: isTreeLoading, refetch: refetchTree } = useQuery({
    queryKey: ['tree', 'active'],
    queryFn: () => fetchTree('active'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (apiTree) {
      const fullTree: FamilyTreeFull = {
        id: apiTree.id || (apiTree as any).tree?.id || 'tree_active',
        name: apiTree.name || (apiTree as any).tree?.name || 'DL-GENEALOGY',
        subtitle: apiTree.subtitle || (apiTree as any).tree?.subtitle || null,
        createdAt: apiTree.createdAt || new Date().toISOString(),
        updatedAt: apiTree.updatedAt || new Date().toISOString(),
        members: apiTree.members || [],
        parentChildEdges: apiTree.parentChildEdges || [],
        unions: apiTree.unions || [],
        artifacts: apiTree.artifacts || [],
      };
      if (fullTree.members.length > 0) {
        setTreeState(fullTree);
        saveCachedTree(fullTree);
      } else {
        const cached = loadCachedTree();
        if (cached && cached.members.length > 0) {
          setTreeState(cached);
        } else {
          setTreeState(fullTree);
        }
      }
    }
  }, [apiTree]);

  const members = Array.isArray(treeState?.members) ? treeState.members : [];
  const parentChildEdges = Array.isArray(treeState?.parentChildEdges) ? treeState.parentChildEdges : [];
  const unions = Array.isArray(treeState?.unions) ? treeState.unions : [];

  // Window viewport size tracking for layout & radar
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1400,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global shortcut (Ctrl+A / Cmd+A) to toggle admin mode on and off
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (!isAdminToggleVisible && role !== 'admin') {
          // Toggle ON: reveal admin toggle and open authentication modal
          setIsAdminToggleVisible(true);
          setIsAdminModalOpen(true);
        } else {
          // Toggle OFF: hide admin toggle, close modal, and revert to viewer mode
          setIsAdminToggleVisible(false);
          setIsAdminModalOpen(false);
          setRole('viewer');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminToggleVisible, role, setRole, setIsAdminToggleVisible, setIsAdminModalOpen]);

  // Dynamically derive generation numbers for all members based on tree hierarchy & unions
  const dynamicMembers = useMemo(() => {
    const genMap = computeDynamicGenerations(members, parentChildEdges, unions);
    return members.map((m) => {
      const dynGen = genMap.get(m.id) ?? m.generation ?? 1;
      return m.generation === dynGen ? m : { ...m, generation: dynGen };
    });
  }, [members, parentChildEdges, unions]);

  // Compute graph layout via ELK.js
  const { nodePositions } = useTreeLayout(dynamicMembers, parentChildEdges, unions);

  // Auto-center camera when members first load into layout
  const [hasInitialCentered, setHasInitialCentered] = useState(false);
  useEffect(() => {
    if (!hasInitialCentered && dynamicMembers.length > 0 && nodePositions.size > 0) {
      const firstMember = dynamicMembers[0];
      const pos = nodePositions.get(firstMember.id);
      if (pos) {
        centerOnNode(pos.x, pos.y, pos.width, pos.height, viewportSize.width, viewportSize.height, 0);
        setHasInitialCentered(true);
      }
    }
  }, [hasInitialCentered, dynamicMembers, nodePositions, viewportSize, centerOnNode]);

  // Focused member object
  const focusedMember = useMemo(() => {
    if (!focusedMemberId) return null;
    return dynamicMembers.find((m) => m.id === focusedMemberId) || null;
  }, [dynamicMembers, focusedMemberId]);

  // Center canvas camera on selected member (offsetting for the 512px drawer)
  const handleSpotlight = useCallback(
    (memberId: string) => {
      focusMember(memberId);
      const pos = nodePositions.get(memberId);
      if (pos) {
        const isMobile = viewportSize.width < 768;
        const drawerOffset = isMobile ? 0 : 480;
        centerOnNode(pos.x, pos.y, pos.width, pos.height, viewportSize.width, viewportSize.height, drawerOffset);
      }
    },
    [focusMember, nodePositions, centerOnNode, viewportSize]
  );

  // Admin Actions
  const handleAddClick = () => {
    setEditingMember(null);
    setEditingSpouseId(null);
    setEditingFatherId(null);
    setEditingMotherId(null);
    setIsFormOpen(true);
  };

  const handleUnlinkSpouse = (memberId: string, spouseId: string) => {
    const targetUnion = unions.find(
      (u) =>
        (u.partner1Id === memberId && u.partner2Id === spouseId) ||
        (u.partner1Id === spouseId && u.partner2Id === memberId)
    );

    setTreeState((prev) => {
      const nextTree = {
        ...prev,
        unions: prev.unions.filter(
          (u) =>
            !(
              (u.partner1Id === memberId && u.partner2Id === spouseId) ||
              (u.partner1Id === spouseId && u.partner2Id === memberId)
            )
        ),
      };
      saveCachedTree(nextTree);
      return nextTree;
    });

    if (targetUnion?.id) {
      deleteUnion(targetUnion.id)
        .then(() => refetchTree())
        .catch((err) => console.warn('API delete union failed, updated locally:', err));
    }
  };

  const handleEdit = (memberId: string) => {
    const member = dynamicMembers.find((m) => m.id === memberId);
    if (member) {
      setEditingMember(member);
      // If exactly 1 spouse, pre-fill for single couple; if multiple spouses (polygamy), keep empty so "Add Spouse" defaults to none
      const memberUnions = unions.filter((u) => u.partner1Id === memberId || u.partner2Id === memberId);
      const spouseId = memberUnions.length === 1
        ? memberUnions[0].partner1Id === memberId
          ? memberUnions[0].partner2Id
          : memberUnions[0].partner1Id
        : null;
      setEditingSpouseId(spouseId);

      // Determine current parents from parentChildEdges
      const parentLinks = parentChildEdges.filter((pc) => pc.childId === memberId);
      let fatherId: string | null = null;
      let motherId: string | null = null;
      parentLinks.forEach((link) => {
        const parentMember = dynamicMembers.find((m) => m.id === link.parentId);
        if (parentMember?.gender === 'female') {
          motherId = link.parentId;
        } else if (parentMember?.gender === 'male') {
          fatherId = link.parentId;
        } else {
          if (!fatherId) fatherId = link.parentId;
          else if (!motherId) motherId = link.parentId;
        }
      });
      setEditingFatherId(fatherId);
      setEditingMotherId(motherId);

      setIsFormOpen(true);
    }
  };

  const handleAddChild = (parentId: string) => {
    const parent = dynamicMembers.find((m) => m.id === parentId);
    const newChildStub: Partial<FamilyMember> = {
      lastName: parent ? parent.lastName : '',
      branch: parent ? parent.branch : 'paternal',
      generation: parent ? parent.generation + 1 : 2,
    };
    setEditingMember(newChildStub as FamilyMember);
    if (parent?.gender === 'female') {
      setEditingMotherId(parentId);
      const motherUnions = unions.filter((u) => u.partner1Id === parentId || u.partner2Id === parentId);
      if (motherUnions.length === 1) {
        const u = motherUnions[0];
        setEditingFatherId(u.partner1Id === parentId ? u.partner2Id : u.partner1Id);
      } else {
        setEditingFatherId(null);
      }
    } else {
      setEditingFatherId(parentId);
      const fatherUnions = unions.filter((u) => u.partner1Id === parentId || u.partner2Id === parentId);
      if (fatherUnions.length === 1) {
        const u = fatherUnions[0];
        setEditingMotherId(u.partner1Id === parentId ? u.partner2Id : u.partner1Id);
      } else {
        setEditingMotherId(null);
      }
    }
    setEditingSpouseId(null);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      setDeletingMember(member);
      setIsFormOpen(false);
      setIsDeleteOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingMember) return;
    const memberId = deletingMember.id;

    setTreeState((prev) => {
      const nextTree = {
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        parentChildEdges: prev.parentChildEdges.filter(
          (pc) => pc.parentId !== memberId && pc.childId !== memberId
        ),
        unions: prev.unions.filter(
          (u) => u.partner1Id !== memberId && u.partner2Id !== memberId
        ),
      };
      saveCachedTree(nextTree);
      return nextTree;
    });

    if (focusedMemberId === memberId) {
      closeFocus();
    }
    deleteMember(memberId)
      .then(() => refetchTree())
      .catch((err) => console.warn('API delete failed, updated locally:', err));
    setIsDeleteOpen(false);
    setDeletingMember(null);
  };

  const handleFormSubmit = (formData: any) => {
    const targetId = editingMember?.id || `mem_${Date.now()}`;
    const isEditing = Boolean(editingMember?.id);

    // Calculate generation based on parent linkage
    let generation = Number(formData.generation) || 1;
    const parentAnchorId = formData.fatherId || formData.motherId;
    if (parentAnchorId) {
      const parent = dynamicMembers.find((m) => m.id === parentAnchorId);
      if (parent) {
        generation = parent.generation + 1;
      }
    } else if (editingMember?.generation) {
      generation = editingMember.generation;
    }

    const memberPayload: FamilyMember = {
      id: targetId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      maidenName: formData.maidenName?.trim() || null,
      gender: formData.gender || 'male',
      dateOfBirth: formData.dateOfBirth,
      dateOfDeath: formData.isDeceased && formData.dateOfDeath ? formData.dateOfDeath : null,
      isDeceased: Boolean(formData.isDeceased),
      generation,
      branch: formData.branch || 'paternal',
      profession: formData.profession?.trim() || null,
      residence: formData.residence?.trim() || null,
      bio: formData.bio?.trim() || null,
      avatarUrl:
        formData.avatarUrl?.trim() ||
        (isEditing && editingMember?.avatarUrl ? editingMember.avatarUrl : null),
      createdAt: isEditing && editingMember?.createdAt ? editingMember.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTreeState((prev) => {
      // 1. Members array
      const updatedMembers = isEditing
        ? prev.members.map((m) => (m.id === targetId ? memberPayload : m))
        : [...prev.members, memberPayload];

      // 2. Unions (spouse linking) - preserves multiple wives / polygamy
      let updatedUnions = [...prev.unions];
      if (formData.spouseId) {
        const alreadyUnioned = updatedUnions.some(
          (u) =>
            (u.partner1Id === targetId && u.partner2Id === formData.spouseId) ||
            (u.partner1Id === formData.spouseId && u.partner2Id === targetId)
        );
        if (!alreadyUnioned) {
          updatedUnions.push({
            id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            partner1Id: targetId,
            partner2Id: formData.spouseId,
            unionType: 'marriage',
            unionDate: null,
            dissolutionDate: null,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // If father and mother were selected, ensure union exists between father & mother
      if (formData.fatherId && formData.motherId) {
        const parentsUnioned = updatedUnions.some(
          (u) =>
            (u.partner1Id === formData.fatherId && u.partner2Id === formData.motherId) ||
            (u.partner1Id === formData.motherId && u.partner2Id === formData.fatherId)
        );
        if (!parentsUnioned) {
          updatedUnions.push({
            id: `u_${Date.now()}_fm`,
            partner1Id: formData.fatherId,
            partner2Id: formData.motherId,
            unionType: 'marriage',
            unionDate: null,
            dissolutionDate: null,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 3. Parent-Child Edges: link Father and Mother explicitly
      let updatedEdges = prev.parentChildEdges.filter((pc) => pc.childId !== targetId);
      if (formData.fatherId) {
        updatedEdges.push({
          id: `pc_${Date.now()}_f`,
          parentId: formData.fatherId,
          childId: targetId,
          relationshipType: 'biological',
          createdAt: new Date().toISOString(),
        });
      }
      if (formData.motherId) {
        updatedEdges.push({
          id: `pc_${Date.now()}_m`,
          parentId: formData.motherId,
          childId: targetId,
          relationshipType: 'biological',
          createdAt: new Date().toISOString(),
        });
      }

      const nextTree = {
        ...prev,
        members: updatedMembers,
        unions: updatedUnions,
        parentChildEdges: updatedEdges,
      };
      saveCachedTree(nextTree);
      return nextTree;
    });

    if (isEditing) {
      updateMember(targetId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        maidenName: formData.maidenName || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        dateOfDeath: formData.isDeceased && formData.dateOfDeath ? formData.dateOfDeath : undefined,
        isDeceased: Boolean(formData.isDeceased),
        generation: generation,
        branch: formData.branch,
        profession: formData.profession || undefined,
        residence: formData.residence || undefined,
        bio: formData.bio || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        spouseId: formData.spouseId ?? '',
        fatherId: formData.fatherId ?? '',
        motherId: formData.motherId ?? '',
      })
        .then(() => refetchTree())
        .catch((err) => console.warn('API update failed, updated locally:', err));
    } else {
      createMember('active', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        maidenName: formData.maidenName || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        dateOfDeath: formData.isDeceased && formData.dateOfDeath ? formData.dateOfDeath : undefined,
        isDeceased: Boolean(formData.isDeceased),
        generation: generation,
        branch: formData.branch,
        profession: formData.profession || undefined,
        residence: formData.residence || undefined,
        bio: formData.bio || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        spouseId: formData.spouseId || undefined,
        fatherId: formData.fatherId || undefined,
        motherId: formData.motherId || undefined,
      })
        .then((newMember) => {
          setTreeState((prev) => {
            const nextTree = {
              ...prev,
              members: prev.members.map((m) => (m.id === targetId ? { ...m, id: newMember.id } : m)),
              parentChildEdges: prev.parentChildEdges.map((pc) => ({
                ...pc,
                parentId: pc.parentId === targetId ? newMember.id : pc.parentId,
                childId: pc.childId === targetId ? newMember.id : pc.childId,
              })),
              unions: prev.unions.map((u) => ({
                ...u,
                partner1Id: u.partner1Id === targetId ? newMember.id : u.partner1Id,
                partner2Id: u.partner2Id === targetId ? newMember.id : u.partner2Id,
              })),
            };
            saveCachedTree(nextTree);
            return nextTree;
          });
          refetchTree();
        })
        .catch((err) => console.warn('API create failed, created locally:', err));
    }

    setIsFormOpen(false);
    setEditingMember(null);
    setEditingSpouseId(null);
    setEditingFatherId(null);
    setEditingMotherId(null);
  };

  // Generation banner Y-offsets
  const generationBanners = useMemo(() => {
    const genMap = new Map<number, number>();
    const genMembersMap = new Map<number, FamilyMember[]>();

    dynamicMembers.forEach((m) => {
      const pos = nodePositions.get(m.id);
      if (pos) {
        const currentMin = genMap.get(m.generation) ?? Infinity;
        if (pos.y < currentMin) {
          genMap.set(m.generation, pos.y);
        }
        if (!genMembersMap.has(m.generation)) {
          genMembersMap.set(m.generation, []);
        }
        genMembersMap.get(m.generation)!.push(m);
      }
    });

    const banners: Array<{ generation: number; label: string; yOffset: number }> = [];
    genMap.forEach((y, gen) => {
      const membersInGen = genMembersMap.get(gen) || [];
      banners.push({
        generation: gen,
        label: getDynamicGenerationLabel(gen, membersInGen),
        yOffset: y - 60,
      });
    });

    return banners.sort((a, b) => a.generation - b.generation);
  }, [dynamicMembers, nodePositions]);

  // Mini-map node positions
  const miniMapMembers = useMemo(() => {
    return dynamicMembers.map((m) => {
      const pos = nodePositions.get(m.id);
      return {
        id: m.id,
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0,
      };
    });
  }, [dynamicMembers, nodePositions]);

  return (
    <div
      className={`relative flex flex-col h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased overflow-hidden select-none ${
        isDrawerOpen ? 'spotlight-active' : ''
      }`}
      id="app"
    >
      {/* 1. TOP NAVIGATION BAR */}
      <TopNavBar
        treeTitle="DL-GENEALOGY"
        recordCount={members.length}
        members={members}
        activeBranch={activeBranchFilter}
        onFilterChange={setBranchFilter}
        onSelectMember={handleSpotlight}
      />

      {/* 2. MAIN INFINITE CANVAS WORKSPACE */}
      <main
        className="relative flex-1 w-full h-full overflow-hidden canvas-dot-grid cursor-grab active:cursor-grabbing"
        id="canvasContainer"
      >
        {/* Loading spinner while fetching active tree from backend */}
        {isTreeLoading && members.length === 0 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none p-4">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-sm w-full text-center border border-zinc-200/60 dark:border-zinc-800/60 shadow-lg pointer-events-auto backdrop-blur-md">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-heritage-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Loading family lineage...</p>
            </div>
          </div>
        )}

        {/* Empty state: Only display the "Create Your Family Tree" call-to-action when in Admin mode */}
        {!isTreeLoading && members.length === 0 && role === 'admin' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none p-4">
            <div className="glass-panel p-6 sm:p-10 rounded-3xl max-w-md w-full text-center border border-amber-500/20 shadow-2xl pointer-events-auto backdrop-blur-xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-heritage-gold shadow-inner">
                <UserPlus className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                Create Your Family Tree
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                Your family archive is currently empty and ready. Start charting your heritage from scratch by adding the first family member.
              </p>
              <button
                onClick={handleAddClick}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-heritage-gold to-amber-600 hover:from-amber-600 hover:to-heritage-gold text-zinc-950 font-semibold shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add First Family Member
              </button>
            </div>
          </div>
        )}

        {/* Read-only notice for visitors when tree has no records yet */}
        {!isTreeLoading && members.length === 0 && role !== 'admin' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-4">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-sm w-full text-center border border-zinc-200/60 dark:border-zinc-800/60 shadow-lg pointer-events-auto backdrop-blur-md">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Family Archive
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                This lineage archive is currently being updated.
              </p>
            </div>
          </div>
        )}

        <CanvasContainer>
          {/* SVG Connections Layer */}
          <SvgEdgeLayer
            positions={nodePositions}
            unions={unions}
            parentChildEdges={parentChildEdges}
            spotlightId={focusedMemberId}
          />

          {/* Generation Marker Guides */}
          {generationBanners.map((banner) => (
            <GenerationBanner
              key={banner.generation}
              generation={banner.generation}
              label={banner.label}
              yOffset={banner.yOffset}
            />
          ))}

          {/* Member Nodes */}
          {dynamicMembers.map((member) => {
            const pos = nodePositions.get(member.id) || {
              x: 0,
              y: 0,
              width: 270,
              height: 160,
            };

            const isFiltered =
              activeBranchFilter !== 'all' && member.branch !== activeBranchFilter;

            return (
              <MemberNodeCard
                key={member.id}
                member={member}
                position={pos}
                isSpotlighted={focusedMemberId === member.id}
                isAdmin={role === 'admin'}
                isFiltered={isFiltered}
                onSpotlight={handleSpotlight}
                onEdit={handleEdit}
                onAddChild={handleAddChild}
              />
            );
          })}
        </CanvasContainer>

        {/* 3. FLOATING HUD CONTROLS & MINI-MAP */}
        <BottomHud
          miniMap={
            <RadarMiniMap
              members={miniMapMembers}
              canvasState={{ translateX, translateY, scale }}
              containerSize={viewportSize}
              spotlightId={focusedMemberId}
            />
          }
          adminFab={role === 'admin' ? <AdminFab onClick={handleAddClick} /> : null}
        />
      </main>

      {/* 4. SLIDE-OVER SPOTLIGHT INSPECTION DRAWER */}
      <SpotlightOverlay isOpen={isDrawerOpen} onClose={closeFocus} />
      <SpotlightDrawer
        member={focusedMember}
        isOpen={isDrawerOpen}
        isAdmin={role === 'admin'}
        allMembers={dynamicMembers}
        parentChildEdges={parentChildEdges}
        unions={unions}
        onClose={closeFocus}
        onSpotlight={handleSpotlight}
        onEdit={handleEdit}
        onRecenter={handleSpotlight}
      />

      {/* 5. ADMIN ADD / EDIT MEMBER MODAL */}
      <MemberFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMember(null);
          setEditingSpouseId(null);
          setEditingFatherId(null);
          setEditingMotherId(null);
        }}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteRequest}
        initialData={editingMember}
        allMembers={dynamicMembers}
        parentChildEdges={parentChildEdges}
        unions={unions}
        onUnlinkSpouse={handleUnlinkSpouse}
        initialSpouseId={editingSpouseId}
        initialFatherId={editingFatherId}
        initialMotherId={editingMotherId}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        memberName={deletingMember ? `${deletingMember.firstName} ${deletingMember.lastName}` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeletingMember(null);
        }}
      />

      {/* 6. ADMIN LOGIN MODAL */}
      <AdminLoginModal />
    </div>
  );
};
