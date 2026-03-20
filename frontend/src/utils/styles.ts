import cytoscape from 'cytoscape';

export function getStylesheet(riskThreshold: number): cytoscape.StylesheetStyle[] {
  return [
    {
      selector: 'node',
      style: {
        'background-color': '#4dabf7',
        'label': 'data(label)',
        'font-size': '10px',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 4,
        'width': 'mapData(metric, 0, 20, 15, 60)',
        'height': 'mapData(metric, 0, 20, 15, 60)',
        'border-width': 1,
        'border-color': '#339af0',
        'color': '#495057',
        'text-max-width': '80px',
        'text-wrap': 'ellipsis',
        'min-zoomed-font-size': 8,
      } as cytoscape.Css.Node,
    },
    {
      selector: 'node[?assembly]',
      style: {
        'shape': 'round-rectangle',
        'background-color': '#69db7c',
        'border-color': '#40c057',
      } as cytoscape.Css.Node,
    },
    {
      selector: 'node[?purchaseable]',
      style: {
        'shape': 'ellipse',
        'background-color': '#4dabf7',
        'border-color': '#339af0',
      } as cytoscape.Css.Node,
    },
    {
      selector: `node[metric >= ${riskThreshold}]`,
      style: {
        'background-color': '#ff6b6b',
        'border-color': '#f03e3e',
        'border-width': 2,
        'font-weight': 'bold',
      } as cytoscape.Css.Node,
    },
    {
      selector: `node[?purchaseable][metric >= ${riskThreshold}]`,
      style: {
        'background-color': '#ff8787',
        'border-color': '#e03131',
        'border-width': 3,
        'border-style': 'double',
      } as cytoscape.Css.Node,
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 3,
        'border-color': '#ffd43b',
        'background-color': '#fcc419',
      } as cytoscape.Css.Node,
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 2,
        'border-color': '#ffd43b',
        'opacity': 1,
      } as cytoscape.Css.Node,
    },
    {
      selector: 'node.dimmed',
      style: {
        'opacity': 0.2,
      } as cytoscape.Css.Node,
    },
    {
      selector: 'edge',
      style: {
        'width': 1,
        'line-color': '#ced4da',
        'target-arrow-color': '#ced4da',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
        'opacity': 0.6,
      } as cytoscape.Css.Edge,
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': '#ffd43b',
        'target-arrow-color': '#ffd43b',
        'width': 2,
        'opacity': 1,
      } as cytoscape.Css.Edge,
    },
    {
      selector: 'edge.dimmed',
      style: {
        'opacity': 0.1,
      } as cytoscape.Css.Edge,
    },
  ];
}
