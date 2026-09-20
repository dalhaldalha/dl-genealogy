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
import { useCanvasStore } from '@/stores/canvas-store';
import { useTreeStore } from '@/stores/tree-store';
import { useSpotlightStore } from '@/stores/spotlight-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTreeLayout } from '@/hooks/useTreeLayout';
import { mockFamilyTree } from '@/data/mockTreeData';
import { fetchTree } from '@/api/trees';
import type { FamilyMember } from '@kinfolk/shared';

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
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);

  // Tree data state (initialized with prototype-perfect mock, enriched by API if available)
  const [treeState, setTreeState] = useState(mockFamilyTree);

  const { data: apiTree } = useQuery({
    queryKey: ['tree', 'active'],
    queryFn: async () => {
      try {
        return await fetchTree('active');
      } catch {
        return mockFamilyTree;
      }
    },
    initialData: mockFamilyTree,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (apiTree && apiTree.members.length > 0) {
      setTreeState(apiTree);
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
    setEditingParentId(null);
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

      // Determine current parent from parentChildEdges
      const parentLink = parentChildEdges.find((pc) => pc.childId === memberId);
      setEditingParentId(parentLink ? parentLink.parentId : null);

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
    setEditingParentId(parentId);
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
    setIsDeleteOpen(false);
    setDeletingMember(null);
  };

  const handleFormSubmit = (formData: any) => {
    const targetId = editingMember?.id || `mem_${Date.now()}`;
    const isEditing = Boolean(editingMember?.id);

    // Calculate generation based on parent linkage
    let generation = Number(formData.generation) || 1;
    if (formData.parentId) {
      const parent = members.find((m) => m.id === formData.parentId);
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
      gender: formData.gender || 'unknown',
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
        (isEditing && editingMember?.avatarUrl
          ? editingMember.avatarUrl
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=260'),
      createdAt: isEditing && editingMember?.createdAt ? editingMember.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTreeState((prev) => {
      // 1. Members array
      const updatedMembers = isEditing
        ? prev.members.map((m) => (m.id === targetId ? memberPayload : m))
        : [...prev.members, memberPayload];

      // 2. Unions (spouse linking)
      let updatedUnions = prev.unions.filter(
        (u) => u.partner1Id !== targetId && u.partner2Id !== targetId
      );
      if (formData.spouseId) {
        updatedUnions = updatedUnions.filter(
          (u) => u.partner1Id !== formData.spouseId && u.partner2Id !== formData.spouseId
        );
        updatedUnions.push({
          id: `u_${Date.now()}`,
          partner1Id: targetId,
          partner2Id: formData.spouseId,
          unionType: 'marriage',
          unionDate: null,
          dissolutionDate: null,
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Parent-Child Edges
      let updatedEdges = prev.parentChildEdges.filter((pc) => pc.childId !== targetId);
      if (formData.parentId) {
        updatedEdges.push({
          id: `pc_${Date.now()}_1`,
          parentId: formData.parentId,
          childId: targetId,
          relationshipType: 'biological',
          createdAt: new Date().toISOString(),
        });

        // If selected parent has a spouse, also link co-parent
        const parentUnion = updatedUnions.find(
          (u) => u.partner1Id === formData.parentId || u.partner2Id === formData.parentId
        );
        if (parentUnion) {
          const secondParentId =
            parentUnion.partner1Id === formData.parentId
              ? parentUnion.partner2Id
              : parentUnion.partner1Id;
          updatedEdges.push({
            id: `pc_${Date.now()}_2`,
            parentId: secondParentId,
            childId: targetId,
            relationshipType: 'biological',
            createdAt: new Date().toISOString(),
          });
        }
      }

      return {
        ...prev,
        members: updatedMembers,
        unions: updatedUnions,
        parentChildEdges: updatedEdges,
      };
    });

    setIsFormOpen(false);
    setEditingMember(null);
    setEditingSpouseId(null);
    setEditingParentId(null);
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
          setEditingParentId(null);
        }}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteRequest}
        initialData={editingMember}
        allMembers={members}
        initialSpouseId={editingSpouseId}
        initialParentId={editingParentId}
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
