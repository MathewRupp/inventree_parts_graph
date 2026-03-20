import React from 'react';
import { Group, SegmentedControl, Select, Switch, NumberInput, Text } from '@mantine/core';
import { FilterState, MetricMode, CategoryOption } from '../types';

interface FilterBarProps {
  filters: FilterState;
  categories: CategoryOption[];
  onFilterChange: (updates: Partial<FilterState>) => void;
}

const METRIC_OPTIONS = [
  { value: 'parent_count', label: 'Parent Count' },
  { value: 'occurrence_count', label: 'Occurrences' },
  { value: 'quantity_weighted', label: 'Qty Weighted' },
];

const PURCHASEABLE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Purchaseable' },
  { value: 'false', label: 'Manufactured' },
];

export default function FilterBar({ filters, categories, onFilterChange }: FilterBarProps) {
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: String(c.pk), label: c.pathstring || c.name })),
  ];

  return (
    <Group gap="md" wrap="wrap" p="xs" style={{ borderBottom: '1px solid #dee2e6', background: '#fff' }}>
      <Group gap="xs">
        <Text size="xs" fw={500} c="dimmed">Metric:</Text>
        <SegmentedControl
          size="xs"
          value={filters.metric}
          onChange={(v) => onFilterChange({ metric: v as MetricMode })}
          data={METRIC_OPTIONS}
        />
      </Group>

      <Select
        size="xs"
        placeholder="Category"
        value={filters.category !== null ? String(filters.category) : ''}
        onChange={(v) => onFilterChange({ category: v ? parseInt(v, 10) : null })}
        data={categoryOptions}
        searchable
        clearable
        style={{ minWidth: 180 }}
      />

      <Select
        size="xs"
        placeholder="Type"
        value={
          filters.purchaseable === null ? '' : filters.purchaseable ? 'true' : 'false'
        }
        onChange={(v) =>
          onFilterChange({
            purchaseable: v === '' ? null : v === 'true',
          })
        }
        data={PURCHASEABLE_OPTIONS}
        style={{ minWidth: 130 }}
      />

      <Switch
        size="xs"
        label="Active only"
        checked={filters.active}
        onChange={(e) => onFilterChange({ active: e.currentTarget.checked })}
      />

      <Group gap={4}>
        <Text size="xs" fw={500} c="dimmed">Min weight:</Text>
        <NumberInput
          size="xs"
          value={filters.minWeight}
          onChange={(v) => onFilterChange({ minWeight: typeof v === 'number' ? v : 0 })}
          min={0}
          step={1}
          style={{ width: 70 }}
        />
      </Group>
    </Group>
  );
}
