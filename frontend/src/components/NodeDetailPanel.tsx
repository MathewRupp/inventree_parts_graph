import React, { useEffect, useState } from 'react';
import { Stack, Text, Group, Badge, Button, Divider, Loader, Paper } from '@mantine/core';
import { IconExternalLink, IconX } from '@tabler/icons-react';
import { PartDetail, MetricMode } from '../types';

interface NodeDetailPanelProps {
  partId: number | null;
  metric: MetricMode;
  fetchDetail: (partId: number) => Promise<PartDetail | null>;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

const METRIC_LABELS: Record<MetricMode, string> = {
  parent_count: 'Parent Count',
  occurrence_count: 'Occurrence Count',
  quantity_weighted: 'Qty Weighted',
};

export default function NodeDetailPanel({
  partId,
  metric,
  fetchDetail,
  onClose,
  onNavigate,
}: NodeDetailPanelProps) {
  const [detail, setDetail] = useState<PartDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partId === null) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetchDetail(partId).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [partId, fetchDetail]);

  if (partId === null) return null;

  return (
    <Paper
      shadow="sm"
      p="md"
      style={{
        width: 280,
        height: '100%',
        borderLeft: '1px solid #dee2e6',
        overflow: 'auto',
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" mb="sm">
        <Text fw={600} size="sm">Part Detail</Text>
        <Button variant="subtle" size="xs" p={2} onClick={onClose}>
          <IconX size={14} />
        </Button>
      </Group>

      {loading && <Loader size="sm" />}

      {!loading && detail && (
        <Stack gap="xs">
          {detail.ipn && (
            <div>
              <Text size="xs" c="dimmed">IPN</Text>
              <Text size="sm" fw={500}>{detail.ipn}</Text>
            </div>
          )}

          <div>
            <Text size="xs" c="dimmed">Name</Text>
            <Text size="sm">{detail.name}</Text>
          </div>

          {detail.category && (
            <div>
              <Text size="xs" c="dimmed">Category</Text>
              <Text size="sm">{detail.category}</Text>
            </div>
          )}

          <Group gap="xs">
            <Badge size="xs" color={detail.active ? 'green' : 'gray'}>
              {detail.active ? 'Active' : 'Inactive'}
            </Badge>
            {detail.purchaseable && (
              <Badge size="xs" color="blue">Purchaseable</Badge>
            )}
            {detail.assembly && (
              <Badge size="xs" color="teal">Assembly</Badge>
            )}
          </Group>

          <Divider />

          <div>
            <Text size="xs" c="dimmed">Direct Parents</Text>
            <Text size="lg" fw={700}>{detail.parent_count}</Text>
          </div>

          <div>
            <Text size="xs" c="dimmed">Direct Children</Text>
            <Text size="lg" fw={700}>{detail.child_count}</Text>
          </div>

          <div>
            <Text size="xs" c="dimmed">{METRIC_LABELS[metric]} (selected metric)</Text>
            <Text size="lg" fw={700} c="blue">{detail[metric]}</Text>
          </div>

          <Divider />

          <Group gap="xs">
            <div style={{ flex: 1 }}>
              <Text size="xs" c="dimmed">Occurrences</Text>
              <Text size="sm">{detail.occurrence_count}</Text>
            </div>
            <div style={{ flex: 1 }}>
              <Text size="xs" c="dimmed">Qty Weighted</Text>
              <Text size="sm">{detail.quantity_weighted}</Text>
            </div>
          </Group>

          <Divider />

          <Button
            size="xs"
            variant="light"
            leftSection={<IconExternalLink size={14} />}
            onClick={() => onNavigate(`/part/${detail.id}/`)}
            fullWidth
          >
            View Part
          </Button>
        </Stack>
      )}

      {!loading && !detail && (
        <Text size="sm" c="dimmed">Part not found</Text>
      )}
    </Paper>
  );
}
