import React, { useState, useMemo, useEffect } from 'react';
import { Users, ArrowRight, X, GitFork } from 'lucide-react';
import { FamilyMember, ParentChild, Union } from '@kinfolk/shared';
import { findKinship, KinshipResult } from '@/lib/kinship/kinship-calculator';

interface KinshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
  parentChildEdges: ParentChild[];
  unions: Union[];
  onSpotlight: (id: string) => void;
  initialMemberA?: string | null;
}

export const KinshipModal: React.FC<KinshipModalProps> = ({
  isOpen,
  onClose,
  members,
  parentChildEdges,
  unions,
  onSpotlight,
  initialMemberA,
}) => {
  const [memberAId, setMemberAId] = useState<string>('');
  const [memberBId, setMemberBId] = useState<string>('');
  const [result, setResult] = useState<KinshipResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialMemberA) setMemberAId(initialMemberA);
      // Don't auto-calculate, wait for user to hit Calculate
      setHasCalculated(false);
      setResult(null);
    }
  }, [isOpen, initialMemberA]);

  const handleCalculate = () => {
    if (!memberAId || !memberBId) return;
    const res = findKinship(memberAId, memberBId, members, parentChildEdges, unions);
    setResult(res);
    setHasCalculated(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/60 shrink-0 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-heritage-gold/10 border border-heritage-gold/20 flex items-center justify-center">
              <GitFork className="w-5 h-5 text-heritage-gold" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              How Are We Related?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Selectors */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Member A</label>
              <select
                value={memberAId}
                onChange={(e) => setMemberAId(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 text-zinc-100 rounded-xl px-4 py-3 focus:outline-none focus:border-heritage-gold/50 focus:ring-1 focus:ring-heritage-gold/50 transition-all appearance-none"
              >
                <option value="">Select a member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Member B</label>
              <select
                value={memberBId}
                onChange={(e) => setMemberBId(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 text-zinc-100 rounded-xl px-4 py-3 focus:outline-none focus:border-heritage-gold/50 focus:ring-1 focus:ring-heritage-gold/50 transition-all appearance-none"
              >
                <option value="">Select a member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={!memberAId || !memberBId || memberAId === memberBId}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-heritage-gold to-amber-600 hover:from-amber-600 hover:to-heritage-gold text-zinc-950 font-bold shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            Find Relationship
          </button>

          {/* Results Area */}
          {hasCalculated && (
            <div className="pt-6 border-t border-zinc-800/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {result ? (
                <div className="space-y-6 text-center">
                  <div>
                    <h3 className="font-serif text-3xl sm:text-4xl text-heritage-gold mb-2">
                      {result.relationship}
                    </h3>
                    <p className="text-zinc-400 text-sm sm:text-base">
                      {result.description}
                    </p>
                  </div>
                  
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                    Consanguinity Degree: {result.degree}
                  </div>

                  {/* Path Visualizer */}
                  <div className="bg-zinc-900/40 rounded-2xl p-4 sm:p-6 border border-zinc-800/50">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                      {result.path.map((pathMemberId, idx) => {
                        const pm = members.find(m => m.id === pathMemberId);
                        if (!pm) return null;
                        const isLast = idx === result.path.length - 1;

                        return (
                          <React.Fragment key={`${pathMemberId}-${idx}`}>
                            <button
                              onClick={() => {
                                onSpotlight(pm.id);
                                onClose();
                              }}
                              className="group flex items-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-heritage-gold/50 rounded-full pr-4 pl-1 py-1 transition-all"
                            >
                              <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                                {pm.avatarUrl ? (
                                  <img src={pm.avatarUrl} alt={pm.firstName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-medium">
                                    {pm.firstName[0]}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-zinc-100 whitespace-nowrap">
                                {pm.firstName} {pm.lastName}
                              </span>
                            </button>
                            
                            {!isLast && (
                              <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                    <GitFork className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400">
                    {memberAId === memberBId 
                      ? "Select two different members to find their relationship."
                      : "No connecting path found between these members."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
