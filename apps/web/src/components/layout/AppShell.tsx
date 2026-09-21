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
import type { FamilyMember, FamilyTreeFull } from '@kinfolk/shared';

const GENERATION_LABELS: Record<number, string> = {
  1: 'Founders (1910 - 1930)',
  2: 'Mid-Century Patriarchs & Matriarchs (1940 - 1965)',
  3: 'The Innovators (1970 - 1995)',
  4: 'The Next Era (2000 - Present)',
};

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

  // Tree data state (starts clean and empty, filled by Supabase or user additions)
  const [treeState, setTreeState] = useState<FamilyTreeFull>(emptyFamilyTree);

  const { data: apiTree, isLoading: isTreeLoading, refetch: refetchTree } = useQuery({
    queryKey: ['tree', 'active'],
    queryFn: () => fetchTree('active'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (apiTree) {
      setTreeState({
        id: apiTree.id || (apiTree as any).tree?.id || 'tree_active',
        name: apiTree.name || (apiTree as any).tree?.name || 'DL-GENEALOGY',
        subtitle: apiTree.subtitle || (apiTree as any).tree?.subtitle || null,
        createdAt: apiTree.createdAt || new Date().toISOString(),
        updatedAt: apiTree.updatedAt || new Date().toISOString(),
        members: apiTree.members || [],
        parentChildEdges: apiTree.parentChildEdges || [],
        unions: apiTree.unions || [],
        artifacts: apiTree.artifacts || [],
      });
    }
  }, [apiTree]);

  const { members, parentChildEdges, unions } = treeState;

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

  // Compute graph layout via ELK.js
  const { nodePositions } = useTreeLayout(members, parentChildEdges, unions);

  // Auto-center camera when members first load into layout
  const [hasInitialCentered, setHasInitialCentered] = useState(false);
  useEffect(() => {
    if (!hasInitialCentered && members.length > 0 && nodePositions.size > 0) {
      const firstMember = members[0];
      const pos = nodePositions.get(firstMember.id);
      if (pos) {
        centerOnNode(pos.x, pos.y, pos.width, pos.height, viewportSize.width, viewportSize.height, 0);
        setHasInitialCentered(true);
      }
    }
  }, [hasInitialCentered, members, nodePositions, viewportSize, centerOnNode]);

  // Focused member object
  const focusedMember = useMemo(() => {
    if (!focusedMemberId) return null;
    return members.find((m) => m.id === focusedMemberId) || null;
  }, [members, focusedMemberId]);

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

  const handleEdit = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      setEditingMember(member);
      // Determine current spouse from unions
      const union = unions.find((u) => u.partner1Id === memberId || u.partner2Id === memberId);
      const spouseId = union
        ? union.partner1Id === memberId
          ? union.partner2Id
          : union.partner1Id
        : null;
      setEditingSpouseId(spouseId);

      // Determine current parents from parentChildEdges
      const parentLinks = parentChildEdges.filter((pc) => pc.childId === memberId);
      let fatherId: string | null = null;
      let motherId: string | null = null;
      parentLinks.forEach((link) => {
        const parentMember = members.find((m) => m.id === link.parentId);
        if (parentMember?.gender === 'female') {
          motherId = link.parentId;
        } else {
          fatherId = link.parentId;
        }
      });
      setEditingFatherId(fatherId);
      setEditingMotherId(motherId);

      setIsFormOpen(true);
    }
  };

  const handleAddChild = (parentId: string) => {
    const parent = members.find((m) => m.id === parentId);
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

    setTreeState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
      parentChildEdges: prev.parentChildEdges.filter(
        (pc) => pc.parentId !== memberId && pc.childId !== memberId
      ),
      unions: prev.unions.filter(
        (u) => u.partner1Id !== memberId && u.partner2Id !== memberId
      ),
    }));

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
      const parent = members.find((m) => m.id === parentAnchorId);
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

      return {
        ...prev,
        members: updatedMembers,
        unions: updatedUnions,
        parentChildEdges: updatedEdges,
      };
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
        branch: formData.branch,
        profession: formData.profession || undefined,
        residence: formData.residence || undefined,
        bio: formData.bio || undefined,
        avatarUrl: formData.avatarUrl || undefined,
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
          setTreeState((prev) => ({
            ...prev,
            members: prev.members.map((m) => (m.id === targetId ? { ...m, id: newMember.id } : m)),
          }));
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
    members.forEach((m) => {
      const pos = nodePositions.get(m.id);
      if (pos) {
        const currentMin = genMap.get(m.generation) ?? Infinity;
        if (pos.y < currentMin) {
          genMap.set(m.generation, pos.y);
        }
      }
    });

    const banners: Array<{ generation: number; label: string; yOffset: number }> = [];
    genMap.forEach((y, gen) => {
      banners.push({
        generation: gen,
        label: GENERATION_LABELS[gen] || `Era ${gen}`,
        yOffset: y - 60,
      });
    });

    return banners.sort((a, b) => a.generation - b.generation);
  }, [members, nodePositions]);

  // Mini-map node positions
  const miniMapMembers = useMemo(() => {
    return members.map((m) => {
      const pos = nodePositions.get(m.id);
      return {
        id: m.id,
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0,
      };
    });
  }, [members, nodePositions]);

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
          {members.map((member) => {
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
        allMembers={members}
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
        allMembers={members}
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
