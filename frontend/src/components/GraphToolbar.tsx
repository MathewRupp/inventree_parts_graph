import React from 'react';
import { Group, ActionIcon, Tooltip, Text, Badge } from '@mantine/core';
import {
  IconZoomIn,
  IconZoomOut,
  IconArrowsMaximize,
  IconRefresh,
  IconPhoto,
  IconLayoutDistributeHorizontal,
} from '@tabler/icons-react';

interface GraphToolbarProps {
  nodeCount: number;
  edgeCount: number;
  truncated: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onResetLayout: () => void;
  onRefresh: () => void;
  onExportPng: () => void;
}

export default function GraphToolbar({
  nodeCount,
  edgeCount,
  truncated,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetLayout,
  onRefresh,
  onExportPng,
}: GraphToolbarProps) {
  return (
    <Group
      gap="xs"
      p="xs"
      style={{ borderBottom: '1px solid #dee2e6', background: '#fff' }}
    >
      <Group gap={4}>
        <Text size="xs" c="dimmed">
          {nodeCount} nodes, {edgeCount} edges
        </Text>
        {truncated && (
          <Badge size="xs" color="orange" variant="light">
            Truncated
          </Badge>
        )}
      </Group>

      <div style={{ flex: 1 }} />

      <Group gap={2}>
        <Tooltip label="Zoom in" position="bottom">
          <ActionIcon size="sm" variant="subtle" onClick={onZoomIn}>
            <IconZoomIn size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Zoom out" position="bottom">
          <ActionIcon size="sm" variant="subtle" onClick={onZoomOut}>
            <IconZoomOut size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Fit to screen" position="bottom">
          <ActionIcon size="sm" variant="subtle" onClick={onFit}>
            <IconArrowsMaximize size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Re-run layout" position="bottom">
          <ActionIcon size="sm" variant="subtle" onClick={onResetLayout}>
            <IconLayoutDistributeHorizontal size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Export PNG" position="bottom">
          <ActionIcon size="sm" variant="subtle" onClick={onExportPng}>
            <IconPhoto size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Refresh data" position="bottom">
          <ActionIcon size="sm" variant="subtle" onClick={onRefresh}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
