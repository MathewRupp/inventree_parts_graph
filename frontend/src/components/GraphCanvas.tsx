import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { GraphData, MetricMode } from '../types';
import { getStylesheet } from '../utils/styles';
import { getFcoseLayout, getCoseLayout } from '../utils/layout';

cytoscape.use(fcose);

export interface GraphCanvasHandle {
  cy: () => cytoscape.Core | null;
  fit: () => void;
  resetLayout: () => void;
  panToNode: (nodeId: number) => void;
  exportPng: () => string | null;
}

interface GraphCanvasProps {
  data: GraphData;
  metric: MetricMode;
  onNodeSelect: (nodeId: number | null) => void;
  onNodeDoubleClick: (nodeId: number) => void;
}

const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(
  ({ data, metric, onNodeSelect, onNodeDoubleClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);

    const buildElements = useCallback((): cytoscape.ElementDefinition[] => {
      const nodes: cytoscape.ElementDefinition[] = data.nodes.map((n) => ({
        data: {
          id: String(n.id),
          label: n.ipn || n.name,
          metric: n[metric],
          assembly: n.assembly,
          purchaseable: n.purchaseable,
          active: n.active,
          name: n.name,
          ipn: n.ipn,
          category: n.category,
          parent_count: n.parent_count,
          occurrence_count: n.occurrence_count,
          quantity_weighted: n.quantity_weighted,
        },
      }));

      const edges: cytoscape.ElementDefinition[] = data.edges.map((e, i) => ({
        data: {
          id: `e${i}-${e.source}-${e.target}`,
          source: String(e.source),
          target: String(e.target),
          quantity: e.quantity,
        },
      }));

      return [...nodes, ...edges];
    }, [data, metric]);

    const runLayout = useCallback((cy: cytoscape.Core) => {
      const nodeCount = cy.nodes().length;
      try {
        const layout = cy.layout(getFcoseLayout(nodeCount));
        layout.run();
      } catch {
        const layout = cy.layout(getCoseLayout());
        layout.run();
      }
    }, []);

    // Initialize Cytoscape
    useEffect(() => {
      if (!containerRef.current) return;

      const elements = buildElements();
      const stylesheet = getStylesheet(data.summary.risk_threshold);

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: stylesheet,
        minZoom: 0.1,
        maxZoom: 5,
        wheelSensitivity: 0.3,
      });

      // Event handlers
      cy.on('tap', 'node', (evt) => {
        const nodeId = parseInt(evt.target.id(), 10);
        onNodeSelect(nodeId);
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          onNodeSelect(null);
          cy.elements().removeClass('highlighted dimmed');
        }
      });

      cy.on('dbltap', 'node', (evt) => {
        const nodeId = parseInt(evt.target.id(), 10);
        onNodeDoubleClick(nodeId);
      });

      // Hover highlighting
      cy.on('mouseover', 'node', (evt) => {
        const node = evt.target;
        const neighborhood = node.closedNeighborhood();
        cy.elements().addClass('dimmed');
        neighborhood.removeClass('dimmed').addClass('highlighted');
      });

      cy.on('mouseout', 'node', () => {
        cy.elements().removeClass('highlighted dimmed');
      });

      cyRef.current = cy;
      runLayout(cy);

      return () => {
        cy.destroy();
        cyRef.current = null;
      };
    }, [data, metric, buildElements, runLayout, onNodeSelect, onNodeDoubleClick]);

    useImperativeHandle(ref, () => ({
      cy: () => cyRef.current,
      fit: () => {
        cyRef.current?.fit(undefined, 30);
      },
      resetLayout: () => {
        if (cyRef.current) runLayout(cyRef.current);
      },
      panToNode: (nodeId: number) => {
        const cy = cyRef.current;
        if (!cy) return;
        const node = cy.getElementById(String(nodeId));
        if (node.length > 0) {
          cy.animate({
            center: { eles: node },
            zoom: 2,
          } as cytoscape.AnimateOptions, {
            duration: 400,
          });
          cy.elements().unselect();
          node.select();
          onNodeSelect(nodeId);
        }
      },
      exportPng: () => {
        if (!cyRef.current) return null;
        return cyRef.current.png({ full: true, scale: 2, bg: '#ffffff' });
      },
    }));

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      />
    );
  }
);

GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
