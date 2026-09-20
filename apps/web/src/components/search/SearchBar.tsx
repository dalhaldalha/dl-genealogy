import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { FamilyMember } from '@kinfolk/shared';
import { SearchResults } from './SearchResults';

interface SearchBarProps {
  members: FamilyMember[];
  onSelect: (id: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ members, onSelect }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<FamilyMember[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (q) {
      const matches = members.filter(
        (m) =>
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q) ||
          (m.profession && m.profession.toLowerCase().includes(q)) ||
          (m.residence && m.residence.toLowerCase().includes(q)) ||
          (m.dateOfBirth && m.dateOfBirth.includes(q))
      );
      setResults(matches);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [debouncedQuery, members]);

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative flex-1">
      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim()) setShowResults(true);
        }}
        placeholder="Search ancestor, title, city, or year..."
        className="w-full pl-9 pr-8 py-2 text-xs md:text-sm rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/50 focus:border-heritage-gold transition-all"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
          title="Clear Search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {showResults && (
        <SearchResults
          results={results}
          query={query}
          onSelect={(id) => {
            onSelect(id);
            handleClear();
          }}
        />
      )}
    </div>
  );
};
