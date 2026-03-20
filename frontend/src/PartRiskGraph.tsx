import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Stack, Text, Center, Loader, Alert, Paper, Group, Button } from '@mantine/core';
import { IconAlertTriangle, IconChartDots3, IconRefresh } from '@tabler/icons-react';
import { checkPluginVersion, InvenTreePluginContext } from '@inventreedb/ui';
import GraphCanvas, { GraphCanvasHandle } from './components/GraphCanvas';
import FilterBar from './components/FilterBar';
import SearchBar from './components/SearchBar';
import NodeDetailPanel from './components/NodeDetailPanel';
import GraphToolbar from './components/GraphToolbar';
import { useGraphData } from './hooks/useGraphData';
import { FilterState } from './types';

interface PartRiskGraphAppProps {
  context: InvenTreePluginContext;
}

function PartRiskGraphApp({ context }: PartRiskGraphAppProps) {
  const canvasRef = useRef<GraphCanvasHandle>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    active: true,
    category: null,
    purchaseable: null,
    assembly: null,
    minWeight: 0,
    metric: 'parent_count',
    search: '',
  });

  const baseUrl = useMemo(() => {
    const host = (context as Record<string, unknown>).host || '';
    return `${host}/plugin/partsgraph/`;
  }, [context]);

  const fetchFn = useCallback(async (url: string): Promise<Response> => {
    const api = (context as Record<string, unknown>).api as Record<string, unknown> | undefined;
    if (api && typeof api.fetch === 'function') {
      return api.fetch(url) as Promise<Response>;
    }
    return fetch(url, { credentials: 'include' });
  }, [context]);

  const { data, loading, error, refetch, fetchPartDetail, fetchSubgraph } =
    useGraphData(baseUrl, filters, fetchFn);

  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNodeSelect = useCallback((nodeId: number | null) => {
    setSelectedNode(nodeId);
  }, []);

  const handleNodeDoubleClick = useCallback(
    async (nodeId: number) => {
      const subgraph = await fetchSubgraph(nodeId);
      if (subgraph && data) {
        // Merge is handled by refetching -- for now just pan to node
        canvasRef.current?.panToNode(nodeId);
      }
    },
    [fetchSubgraph, data]
  );

  const handleSearch = useCallback((query: string) => {
    handleFilterChange({ search: query });
  }, [handleFilterChange]);

  const handleSearchSelect = useCallback((nodeId: number) => {
    canvasRef.current?.panToNode(nodeId);
  }, []);

  const handleNavigate = useCallback(
    (url: string) => {
      const nav = (context as Record<string, unknown>).navigate;
      if (typeof nav === 'function') {
        (nav as (url: string) => void)(url);
      } else {
        window.location.href = url;
      }
    },
    [context]
  );

  const handleExportPng = useCallback(() => {
    const png = canvasRef.current?.exportPng();
    if (png) {
      const link = document.createElement('a');
      link.href = png;
      link.download = 'part-risk-graph.png';
      link.click();
    }
  }, []);

  // Loading state
  if (loading && !data) {
    return (
      <Center h={400}>
        <Stack align="center" gap="sm">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">Loading graph data...</Text>
        </Stack>
      </Center>
    );
  }

  // Error state
  if (error) {
    return (
      <Center h={400}>
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Failed to load graph"
          color="red"
          variant="light"
          style={{ maxWidth: 400 }}
        >
          <Text size="sm">{error}</Text>
          <Button
            size="xs"
            variant="light"
            mt="sm"
            leftSection={<IconRefresh size={14} />}
            onClick={refetch}
          >
            Retry
          </Button>
        </Alert>
      </Center>
    );
  }

  // Empty state
  if (data && data.nodes.length === 0) {
    return (
      <Stack h="100%">
        <FilterBar
          filters={filters}
          categories={data.categories || []}
          onFilterChange={handleFilterChange}
        />
        <Center style={{ flex: 1 }}>
          <Paper p="xl" style={{ textAlign: 'center' }}>
            <IconChartDots3 size={48} color="#adb5bd" />
            <Text size="lg" fw={500} mt="md">No BOM data found</Text>
            <Text size="sm" c="dimmed" mt="xs">
              No parts match the current filters, or no BOM relationships exist.
            </Text>
            {filters.search || filters.category !== null || filters.minWeight > 0 ? (
              <Button
                size="xs"
                variant="light"
                mt="md"
                onClick={() =>
                  setFilters({
                    active: true,
                    category: null,
                    purchaseable: null,
                    assembly: null,
                    minWeight: 0,
                    metric: filters.metric,
                    search: '',
                  })
                }
              >
                Clear Filters
              </Button>
            ) : null}
          </Paper>
        </Center>
      </Stack>
    );
  }

  if (!data) return null;

  return (
    <Stack gap={0} style={{ height: 'calc(100vh - 120px)', minHeight: 500 }}>
      {/* Filter bar */}
      <FilterBar
        filters={filters}
        categories={data.categories || []}
        onFilterChange={handleFilterChange}
      />

      {/* Toolbar with search */}
      <Group gap={0} style={{ borderBottom: '1px solid #dee2e6', background: '#fff' }}>
        <div style={{ padding: '4px 8px' }}>
          <SearchBar
            nodes={data.nodes}
            onSelect={handleSearchSelect}
            onSearch={handleSearch}
          />
        </div>
        <div style={{ flex: 1 }}>
          <GraphToolbar
            nodeCount={data.summary.node_count}
            edgeCount={data.summary.edge_count}
            truncated={data.summary.truncated}
            onZoomIn={() => {
              const cy = canvasRef.current?.cy();
              if (cy) cy.zoom(cy.zoom() * 1.3);
            }}
            onZoomOut={() => {
              const cy = canvasRef.current?.cy();
              if (cy) cy.zoom(cy.zoom() / 1.3);
            }}
            onFit={() => canvasRef.current?.fit()}
            onResetLayout={() => canvasRef.current?.resetLayout()}
            onRefresh={refetch}
            onExportPng={handleExportPng}
          />
        </div>
      </Group>

      {/* Truncation warning */}
      {data.summary.truncated && (
        <Alert color="orange" variant="light" p="xs" style={{ borderRadius: 0 }}>
          <Text size="xs">
            Showing {data.summary.node_count} of {data.summary.max_nodes}+ nodes.
            Apply filters to narrow results.
          </Text>
        </Alert>
      )}

      {/* Main content area */}
      <Group
        gap={0}
        align="stretch"
        wrap="nowrap"
        style={{ flex: 1, overflow: 'hidden' }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
              }}
            >
              <Loader size="xs" />
            </div>
          )}
          <GraphCanvas
            ref={canvasRef}
            data={data}
            metric={filters.metric}
            onNodeSelect={handleNodeSelect}
            onNodeDoubleClick={handleNodeDoubleClick}
          />
        </div>
        <NodeDetailPanel
          partId={selectedNode}
          metric={filters.metric}
          fetchDetail={fetchPartDetail}
          onClose={() => setSelectedNode(null)}
          onNavigate={handleNavigate}
        />
      </Group>
    </Stack>
  );
}

export function renderPartRiskGraph(context: InvenTreePluginContext) {
  checkPluginVersion(context);
  return <PartRiskGraphApp context={context} />;
}
