import React, { useState, useCallback, useRef } from 'react';
import { TextInput, ActionIcon, Group } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { GraphNode } from '../types';

interface SearchBarProps {
  nodes: GraphNode[];
  onSelect: (nodeId: number) => void;
  onSearch: (query: string) => void;
}

export default function SearchBar({ nodes, onSelect, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GraphNode[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.length >= 2) {
        const q = value.toLowerCase();
        const matches = nodes
          .filter(
            (n) =>
              n.name.toLowerCase().includes(q) ||
              n.ipn.toLowerCase().includes(q)
          )
          .slice(0, 10);
        setSuggestions(matches);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [nodes]
  );

  const handleSelect = useCallback(
    (node: GraphNode) => {
      setQuery(node.ipn || node.name);
      setShowSuggestions(false);
      onSelect(node.id);
    },
    [onSelect]
  );

  const handleSubmit = useCallback(() => {
    setShowSuggestions(false);
    onSearch(query);
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch('');
  }, [onSearch]);

  return (
    <div style={{ position: 'relative' }}>
      <Group gap={4}>
        <TextInput
          ref={inputRef}
          size="xs"
          placeholder="Search parts..."
          value={query}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') setShowSuggestions(false);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          leftSection={<IconSearch size={14} />}
          rightSection={
            query ? (
              <ActionIcon size="xs" variant="subtle" onClick={handleClear}>
                <IconX size={12} />
              </ActionIcon>
            ) : null
          }
          style={{ width: 220 }}
        />
      </Group>
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: 250,
            overflow: 'auto',
          }}
        >
          {suggestions.map((node) => (
            <div
              key={node.id}
              onClick={() => handleSelect(node)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f3f5',
                fontSize: '12px',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = '#f1f3f5';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <div style={{ fontWeight: 500 }}>{node.ipn || node.name}</div>
              {node.ipn && (
                <div style={{ color: '#868e96', fontSize: '11px' }}>{node.name}</div>
              )}
              <div style={{ color: '#adb5bd', fontSize: '10px' }}>{node.category}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
