# Product Requirements Document

## Product Name

InvenTree BOM Risk Graph Plugin

## Working Title

**Part Risk Graph**

## Document Status

Draft PRD

## Owner

Mathew Rupp

## Summary

Create an InvenTree plugin that provides a global, interactive graph view of part relationships derived from BOM data, similar in spirit to Obsidian’s graph view. The plugin will visualize how parts are connected across products and assemblies, and help users identify reuse concentration, change impact, and supply-chain risk.

The graph will not be centered on a single part as the primary experience. Instead, it will exist as a **custom plugin page** in InvenTree, reachable from the main navigation. Users can search, filter, and explore the full part network or subsets of it.

A node’s weight and size will be **selectable by the user**. For example, a 10k resistor that appears in 20 distinct BOMs should appear more prominent than a part used in only one product. However, recursive usage should not be double-counted through nested subassemblies. The initial metric model should use **direct BOM usage only**.

The main business goal is risk identification: help teams identify parts that are reused across many products so alternates or replacement strategies can be developed before shortages or obsolescence events occur.

---

# 1. Problem Statement

InvenTree provides structured BOM data, but it is difficult to understand cross-product reuse, dependency concentration, and part exposure from list and table views alone.

Users need a visual tool to answer questions such as:

- Which parts are used across many products?
- Which components represent high blast-radius change risk?
- Which purchased parts should have approved alternates identified before they become a problem?
- Which components are emerging as single points of failure in the product catalog?
- Which products share common dependencies that could create supply risk?

Standard BOM views are strong for precise editing and review, but weak for system-level relationship analysis.

---

# 2. Goals

1. Provide a **global graph page** for exploring BOM-derived part relationships.
2. Visualize part centrality and reuse using configurable node sizing.
3. Help users identify **change impact risk** for heavily reused parts.
4. Help users identify **supply-chain risk** and possible single points of failure.
5. Allow users to filter the graph to manageable and meaningful subsets.
6. Support future scaling from a small database to a much larger historical import set.
7. Keep the experience exploratory and intuitive while remaining grounded in InvenTree BOM semantics.

---

# 3. Non-Goals

1. Replacing the native BOM editor.
2. Full supplier risk analytics in the MVP.
3. Automatic alternate-part recommendation in the MVP.
4. Recursive dependency scoring in the MVP.
5. Saved views or saved filter presets in the MVP.
6. Part-specific tab-first UX; this is not primarily a part-page tool.

---

# 4. Users

## Primary Users

- manufacturing engineers
- electrical engineers
- mechanical engineers
- test engineers
- production planners
- supply chain / sourcing personnel

## Secondary Users

- engineering managers
- NPI teams
- configuration control personnel
- quality engineers

---

# 5. Product Vision

The plugin should function as a **global part relationship and risk map** for InvenTree.

It should combine the intuitive exploratory feel of Obsidian’s graph view with BOM-aware semantics so users can visually identify highly reused parts, dependency clusters, and components that warrant proactive alternate sourcing.

The plugin should feel native to InvenTree, but operate as a distinct analysis surface rather than a standard detail-page widget.

---

# 6. Core User Stories

1. As a manufacturing engineer, I want to see which parts are reused across many assemblies so I can identify standardization and exposure risk.
2. As a design engineer, I want to visually inspect shared components between products so I can understand change impact.
3. As a supply-chain user, I want to identify heavily reused purchased parts so I can prioritize alternate sourcing.
4. As a manager, I want to detect single points of failure before shortages affect multiple products.
5. As a user, I want to search and filter the graph so I can focus on a category, product family, or risk subset.
6. As a user, I want selectable node-sizing modes so I can analyze the graph from different perspectives.

---

# 7. Product Placement Recommendation

## Recommendation

This feature should be implemented as a **custom plugin page** with a **global navigation entry**, not as a part-specific page tool.

## Rationale

This aligns with the user’s primary need:

- analyze cross-product relationships
- identify systemic risk
- explore the full or filtered network
- avoid anchoring the experience to a single part page

## InvenTree Placement Approach

Based on InvenTree plugin documentation, the recommended placement is:

- **NavigationMixin** to add a top-level or menu navigation item for the graph page
- **UrlsMixin** to expose plugin routes under `/plugin/{plugin.slug}/...`
- **UserInterfaceMixin** for the richer frontend integration required by an interactive graph UI

This provides a clean separation between normal record management and system-level graph analysis.

---

# 8. Functional Requirements

## 8.1 Graph Model

The plugin shall represent parts and BOM relationships as a graph.

### Nodes

Each node represents an InvenTree part.

### Edges

Each edge represents a **direct BOM relationship** between a parent part and a child part.

Important rule:

- only **direct BOM usage** counts for the initial graph metrics
- nested subassembly membership must **not** double-count a part
- if Part A is in Subassembly B and Subassembly B is in Product C, the direct usage metric for Part A should count B, not B and C

## 8.2 Node Sizing Modes

Node sizing shall be **selectable by the user**.

Initial supported sizing modes should include:

1. **Distinct parent count**
   - number of unique parent BOMs that directly use the part
2. **Direct occurrence count**
   - number of direct BOM line occurrences across all parent BOMs
3. **Quantity-weighted direct usage**
   - sum of direct quantities across BOM lines

The UI should allow the user to switch sizing mode without leaving the graph page.

## 8.3 Default Metric Behavior

Default node-size mode for MVP:

- **Distinct parent count**

Reason:

- it best represents cross-product exposure
- it aligns with change impact and supply risk analysis
- it is easier to interpret than raw quantity in an early release

## 8.4 Graph Views

The MVP shall focus on a **global graph page**.

Supported scopes should include:

- all eligible parts, subject to performance limits
- filtered subsets by category
- filtered subsets by active status
- filtered subsets by part type
- filtered subsets by purchasable/manufactured status
- filtered subsets by minimum weight threshold

## 8.5 Interaction

Users shall be able to:

- pan and zoom
- hover nodes for summary metadata
- click nodes for a details panel
- search for parts by part number, IPN, or name
- highlight direct neighbors
- expand neighborhood context on demand
- click through to the native InvenTree part page

## 8.6 Filters

The graph page should support filters for:

- active vs inactive parts
- category
- purchasable vs manufactured
- part type, if available in the deployment
- minimum node weight threshold
- graph depth / local neighborhood expansion depth

Inactive and obsolete parts should be **hidden by default**.

## 8.7 Node Detail Panel

When a node is selected, the UI should show:

- part number / IPN
- part name
- category
- active status
- part type
- direct parent count
- direct child count
- current size metric value
- link to part detail page

Future optional fields:

- approved alternates
- supplier count
- stock status
- lifecycle/obsolescence flags

## 8.8 Risk Highlighting

The MVP should support visual emphasis for potentially risky parts.

Initial risk-oriented overlays should include:

- high direct parent count
- low supplier/alternate coverage when that data is available
- purchasable parts above a usage threshold

In the MVP, these may be represented through filters, badges, or highlighting rules rather than full scoring.

## 8.9 Performance Safeguards

The plugin shall include:

- maximum render limits
- minimum weight filtering
- server-side filtering
- lazy neighborhood expansion where necessary
- metric caching / precomputation
- user warning when requested graph scope is too large

This is especially important because the current part count is small, but future imports may include 15 years of historical BOM data.

---

# 9. Risk Analysis Intent

The graph is not only a visualization tool. Its primary purpose is to support **proactive risk identification**.

## MVP Risk Questions the Plugin Should Help Answer

- Which parts are used in the most different BOMs?
- Which purchased parts would affect the most assemblies if they became unavailable?
- Which components appear central enough that they should have alternates identified now?
- Which categories contain hidden dependency concentration?

## Risk Themes

1. **Visualization**
   - make relationship density easy to see
2. **Change Impact Analysis**
   - show which parts have broad downstream exposure
3. **Supply Chain / Single Point of Failure Analysis**
   - identify heavily reused purchased parts that represent sourcing risk

---

# 10. Technical Requirements

## 10.1 Architecture Overview

The plugin should use a backend/frontend split:

- backend plugin code to gather and serve graph data
- frontend graph application rendered as a plugin page
- optional cache/index for precomputed graph metrics

## 10.2 InvenTree Integration Approach

Recommended plugin mixins / integration points:

- **NavigationMixin**: add a global nav item for the graph page
- **UrlsMixin**: expose plugin endpoints and page routes under the plugin URL namespace
- **UserInterfaceMixin**: support richer frontend integration where appropriate

## 10.3 API and Data Access Strategy

The plugin may either:

- call internal InvenTree models directly in backend plugin code for efficient data assembly, and/or
- expose plugin-specific REST endpoints for the frontend to consume

The frontend should not be forced to reconstruct the full graph by chaining many raw REST calls.

Instead, the plugin backend should provide graph-oriented responses such as:

- nodes with computed metrics
- edges between eligible nodes
- filtered subsets
- node detail payloads

## 10.4 Proposed Plugin Endpoints

Example plugin endpoints:

- `GET /plugin/part-risk-graph/graph/summary/`
- `GET /plugin/part-risk-graph/graph/nodes/`
- `GET /plugin/part-risk-graph/graph/edges/`
- `GET /plugin/part-risk-graph/graph/subgraph/`
- `GET /plugin/part-risk-graph/part/<part_id>/detail/`
- `GET /plugin/part-risk-graph/metrics/options/`

Potential endpoint behavior:

- return graph subsets based on filters
- return current metric mode options
- return part detail data for selected nodes
- support pagination or threshold gating for very large result sets

## 10.5 Recommended Frontend Stack

Based on InvenTree frontend plugin guidance, the frontend should be implemented with:

- React
- TypeScript
- Axios for API access
- a graph visualization library suitable for force-directed graphs

Recommended graph libraries to evaluate:

- **Cytoscape.js**
- **React Flow** with custom layout support
- **vis-network**

Preferred early recommendation:

- **Cytoscape.js**, because it is well suited to graph-style interaction, filtering, styling, and incremental exploration

## 10.6 Caching and Refresh Strategy

Because graph metrics may become expensive as data grows, the plugin should support:

- cached metric computation
- scheduled rebuild or on-demand refresh
- cache invalidation when BOM data changes, if practical

MVP acceptable options:

- manual “refresh graph index” action in admin/plugin settings
- periodic background recompute where platform constraints allow

## 10.7 Permissions and Security

The plugin must respect InvenTree’s existing permission model.

Users should only see:

- parts they can access
- BOM relationships they are authorized to view

Unauthorized nodes and edges must be omitted from graph responses.

---

# 11. Data and Metric Definitions

## 11.1 Part Eligibility

Default eligible graph nodes:

- active parts only

Excluded by default:

- inactive or obsolete parts

Optional toggle:

- include inactive parts

## 11.2 Direct Parent Count

Definition:

- number of distinct parent parts whose BOM directly contains the selected child part

## 11.3 Direct Occurrence Count

Definition:

- total number of BOM lines in which the selected child part appears directly

## 11.4 Quantity-Weighted Direct Usage

Definition:

- sum of direct BOM quantities across all BOM lines for the selected child part

## 11.5 No Recursive Double Counting

Definition:

- direct usage metrics must not count indirect inclusion through nested assemblies

Example:

- resistor R1 in subassembly S1
- subassembly S1 in top-level product P1
- direct parent count for R1 = 1 for S1, not 2 for S1 and P1

---

# 12. UX Requirements

## 12.1 Design Principles

- fast to understand
- exploratory
- low-friction filtering
- useful for risk scanning
- scalable to denser datasets

## 12.2 Visual Language

- larger nodes indicate higher value under the selected metric
- dense hubs should be easy to spot visually
- inactive parts hidden by default
- selected nodes clearly emphasized
- direct neighbors highlighted on selection

## 12.3 Empty and Error States

The plugin should clearly message:

- no graph data available
- no parts match the current filters
- graph too large, refine filters
- graph metrics/index not yet built
- insufficient permission to access data

---

# 13. MVP Definition

The MVP should include:

1. custom plugin page accessible from navigation
2. global graph rendering of BOM-derived relationships
3. nodes = parts, edges = direct BOM relationships
4. node size mode selectable by user
5. initial supported metrics:
   - distinct parent count
   - direct occurrence count
   - quantity-weighted direct usage
6. inactive parts hidden by default
7. search by part number / IPN / name
8. filter by category, activity state, and minimum weight threshold
9. node detail panel
10. click-through to native part page
11. graph render safeguards for large datasets
12. basic risk-oriented highlighting for highly reused parts

---

# 14. Future Phases

## Phase 2

- supplier overlays
- approved alternate overlays
- stock overlays
- explicit risk scoring
- category-based styling
- export graph image / CSV / JSON

## Phase 3

- saved filters / saved views
- recursive analysis mode
- historical trend comparison
- alternate recommendation workflows
- change review workflows
- obsolescence campaign planning tools

---

# 15. Success Metrics

## Adoption Metrics

- weekly graph page opens
- number of unique users using the graph
- number of filtered graph sessions

## Utility Metrics

- user-reported usefulness for identifying high-risk shared parts
- time required to identify multi-product impact from a part shortage
- number of alternates identified for high-exposure parts after using the tool

## Technical Metrics

- graph response time
- initial render time
- interaction smoothness under target node counts

---

# 16. Constraints and Assumptions

- current part database is approximately 2,000 unique parts
- future historical imports may significantly increase graph size
- MVP should prioritize clarity and performance over exhaustive graph scope
- risk analysis is the core value, not just visual novelty
- saved views are deferred
- the graph is a standalone custom page, not primarily embedded in a part detail page

---

# 17. Open Questions

1. Should graph edges always display, or should some views collapse low-value edges for readability?
2. Should risk highlighting be color-based, badge-based, or panel-based in the MVP?
3. Should supplier-count and alternate-count overlays be included in MVP if the data is already clean?
4. Should the plugin include an admin page for cache rebuild/index refresh controls?
5. Should the graph include category legend and tutorial help for first-time users?

---

# 18. Research Notes: InvenTree API / Plugin Basis

This PRD assumes implementation aligned with the InvenTree 1.1.x documentation.

Relevant documentation areas include:

- API overview and REST usage
- frontend plugin integration guidance
- NavigationMixin for adding navigation items
- UrlsMixin for plugin-hosted routes
- UserInterfaceMixin for richer frontend/UI integration

The implementation should use plugin-specific graph endpoints rather than requiring the browser to reconstruct the graph from many low-level API requests.

---

# 19. PRD Summary

The InvenTree BOM Risk Graph Plugin is a global analysis tool that visualizes part relationships derived from direct BOM usage. It is designed to help users identify high-exposure parts, understand change impact, and proactively reduce supply-chain risk by highlighting shared dependencies across products.

The MVP should launch as a custom plugin page with a navigation entry, support selectable node-sizing metrics, hide inactive parts by default, and focus on direct usage relationships without recursive double counting.
