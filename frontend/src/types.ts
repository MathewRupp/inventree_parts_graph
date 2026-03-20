export interface GraphNode {
  id: number;
  name: string;
  ipn: string;
  category: string;
  category_id: number | null;
  active: boolean;
  purchaseable: boolean;
  assembly: boolean;
  parent_count: number;
  occurrence_count: number;
  quantity_weighted: number;
}

export interface GraphEdge {
  source: number;
  target: number;
  quantity: number;
}

export interface GraphSummary {
  node_count: number;
  edge_count: number;
  truncated: boolean;
  max_nodes: number;
  risk_threshold: number;
  risk_percentile: number;
  metric: MetricMode;
}

export interface CategoryOption {
  pk: number;
  name: string;
  pathstring: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: GraphSummary;
  categories: CategoryOption[];
}

export interface PartDetail {
  id: number;
  name: string;
  ipn: string;
  category: string;
  category_id: number | null;
  active: boolean;
  purchaseable: boolean;
  assembly: boolean;
  parent_count: number;
  child_count: number;
  occurrence_count: number;
  quantity_weighted: number;
}

export type MetricMode = 'parent_count' | 'occurrence_count' | 'quantity_weighted';

export interface MetricOption {
  value: MetricMode;
  label: string;
  description: string;
}

export interface FilterState {
  active: boolean;
  category: number | null;
  purchaseable: boolean | null;
  assembly: boolean | null;
  minWeight: number;
  metric: MetricMode;
  search: string;
}
