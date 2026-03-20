export function getFcoseLayout(nodeCount: number) {
  return {
    name: 'fcose' as const,
    animate: nodeCount < 500,
    animationDuration: 500,
    fit: true,
    padding: 30,
    nodeDimensionsIncludeLabels: true,
    uniformNodeDimensions: false,
    quality: nodeCount > 1000 ? 'draft' : 'default',
    randomize: true,
    nodeRepulsion: () => 4500,
    idealEdgeLength: () => 80,
    edgeElasticity: () => 0.45,
    nestingFactor: 0.1,
    gravity: 0.25,
    gravityRange: 3.8,
    numIter: nodeCount > 1000 ? 1000 : 2500,
    tile: true,
    tilingPaddingVertical: 10,
    tilingPaddingHorizontal: 10,
  };
}

export function getCoseLayout() {
  return {
    name: 'cose' as const,
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 30,
    nodeDimensionsIncludeLabels: true,
    nodeRepulsion: () => 4500,
    idealEdgeLength: () => 80,
    edgeElasticity: () => 0.45,
    gravity: 0.25,
    numIter: 1000,
  };
}
