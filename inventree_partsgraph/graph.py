"""Graph computation: queries BOM data and computes node metrics."""

import hashlib
import json
import logging

import numpy as np
from django.core.cache import cache
from django.db.models import Count, Q, Sum

from part.models import BomItem, Part, PartCategory

logger = logging.getLogger("inventree")


def _cache_key(params: dict) -> str:
    raw = json.dumps(params, sort_keys=True)
    return f"partsgraph:{hashlib.md5(raw.encode()).hexdigest()}"


def get_categories() -> list[dict]:
    """Return all part categories for filter dropdowns."""
    return list(
        PartCategory.objects.values("pk", "name", "pathstring").order_by("pathstring")
    )


def get_metric_options() -> list[dict]:
    return [
        {
            "value": "parent_count",
            "label": "Distinct Parent Count",
            "description": "Number of unique parent BOMs using this part",
        },
        {
            "value": "occurrence_count",
            "label": "Occurrence Count",
            "description": "Total BOM line appearances across all parents",
        },
        {
            "value": "quantity_weighted",
            "label": "Quantity-Weighted Usage",
            "description": "Sum of BOM quantities across all parents",
        },
    ]


def build_graph_data(
    *,
    active: bool = True,
    category: int | None = None,
    purchaseable: bool | None = None,
    assembly: bool | None = None,
    min_weight: float = 0,
    metric: str = "parent_count",
    search: str = "",
    max_nodes: int = 2000,
    cache_ttl: int = 300,
    risk_percentile: int = 90,
) -> dict:
    """Build the complete graph payload: nodes, edges, summary."""
    params = {
        "active": active,
        "category": category,
        "purchaseable": purchaseable,
        "assembly": assembly,
        "min_weight": min_weight,
        "metric": metric,
        "search": search,
        "max_nodes": max_nodes,
        "risk_percentile": risk_percentile,
    }

    key = _cache_key(params)
    cached = cache.get(key)
    if cached is not None:
        return cached

    result = _compute_graph(params)
    cache.set(key, result, cache_ttl)
    return result


def _compute_graph(params: dict) -> dict:
    """Core graph computation."""
    # Build part queryset with filters
    parts_qs = Part.objects.all()
    if params["active"]:
        parts_qs = parts_qs.filter(active=True)
    if params["category"] is not None:
        parts_qs = parts_qs.filter(category_id=params["category"])
    if params["purchaseable"] is not None:
        parts_qs = parts_qs.filter(purchaseable=params["purchaseable"])
    if params["assembly"] is not None:
        parts_qs = parts_qs.filter(assembly=params["assembly"])
    if params["search"]:
        q = params["search"]
        parts_qs = parts_qs.filter(
            Q(name__icontains=q) | Q(IPN__icontains=q)
        )

    part_ids = set(parts_qs.values_list("pk", flat=True))

    # Get BOM items where both parent and child are in filtered set
    bom_qs = BomItem.objects.filter(
        part_id__in=part_ids, sub_part_id__in=part_ids
    ).select_related("part", "sub_part")

    # Compute metrics via bulk annotation
    metrics_qs = (
        BomItem.objects.filter(sub_part_id__in=part_ids, sub_part__active=True)
        .values("sub_part_id")
        .annotate(
            parent_count=Count("part", distinct=True),
            occurrence_count=Count("id"),
            quantity_weighted=Sum("quantity"),
        )
    )

    # Apply min_weight filter (HAVING equivalent)
    metric_field = params["metric"]
    if params["min_weight"] > 0:
        metrics_qs = metrics_qs.filter(
            **{f"{metric_field}__gte": params["min_weight"]}
        )

    metrics_by_part = {
        row["sub_part_id"]: {
            "parent_count": row["parent_count"],
            "occurrence_count": row["occurrence_count"],
            "quantity_weighted": float(row["quantity_weighted"] or 0),
        }
        for row in metrics_qs
    }

    # If min_weight > 0, restrict to parts that passed the metric filter
    if params["min_weight"] > 0:
        metric_part_ids = set(metrics_by_part.keys())
        # Also keep parent parts that reference these parts
        parent_ids = set(
            BomItem.objects.filter(sub_part_id__in=metric_part_ids)
            .values_list("part_id", flat=True)
        )
        part_ids = (metric_part_ids | parent_ids) & part_ids

    # Parts involved in BOM relationships within the filtered set
    bom_part_ids = set()
    edges = []
    for item in bom_qs:
        if item.part_id in part_ids and item.sub_part_id in part_ids:
            bom_part_ids.add(item.part_id)
            bom_part_ids.add(item.sub_part_id)
            edges.append(
                {
                    "source": item.part_id,
                    "target": item.sub_part_id,
                    "quantity": float(item.quantity),
                }
            )

    # Only include parts that participate in BOM relationships
    relevant_parts = parts_qs.filter(pk__in=bom_part_ids).select_related("category")

    # Check truncation
    truncated = len(bom_part_ids) > params["max_nodes"]
    if truncated:
        # Take the top nodes by metric and their neighbors
        sorted_ids = sorted(
            bom_part_ids,
            key=lambda pid: metrics_by_part.get(pid, {}).get(metric_field, 0),
            reverse=True,
        )
        keep_ids = set(sorted_ids[: params["max_nodes"]])
        relevant_parts = relevant_parts.filter(pk__in=keep_ids)
        edges = [
            e for e in edges if e["source"] in keep_ids and e["target"] in keep_ids
        ]

    # Build nodes
    nodes = []
    for part in relevant_parts:
        m = metrics_by_part.get(part.pk, {})
        nodes.append(
            {
                "id": part.pk,
                "name": part.name,
                "ipn": part.IPN or "",
                "category": part.category.pathstring if part.category else "",
                "category_id": part.category_id,
                "active": part.active,
                "purchaseable": part.purchaseable,
                "assembly": part.assembly,
                "parent_count": m.get("parent_count", 0),
                "occurrence_count": m.get("occurrence_count", 0),
                "quantity_weighted": m.get("quantity_weighted", 0),
            }
        )

    # Compute risk threshold
    metric_values = [n[metric_field] for n in nodes if n[metric_field] > 0]
    risk_threshold = 0
    if metric_values:
        risk_threshold = float(
            np.percentile(metric_values, params["risk_percentile"])
        )

    summary = {
        "node_count": len(nodes),
        "edge_count": len(edges),
        "truncated": truncated,
        "max_nodes": params["max_nodes"],
        "risk_threshold": risk_threshold,
        "risk_percentile": params["risk_percentile"],
        "metric": metric_field,
    }

    return {"nodes": nodes, "edges": edges, "summary": summary}


def get_subgraph(part_id: int, depth: int = 2, active: bool = True) -> dict:
    """Get neighborhood subgraph around a specific part."""
    visited = set()
    frontier = {part_id}

    for _ in range(depth):
        if not frontier:
            break
        bom_qs = BomItem.objects.filter(
            Q(part_id__in=frontier) | Q(sub_part_id__in=frontier)
        )
        if active:
            bom_qs = bom_qs.filter(part__active=True, sub_part__active=True)

        new_ids = set()
        for item in bom_qs:
            new_ids.add(item.part_id)
            new_ids.add(item.sub_part_id)

        visited |= frontier
        frontier = new_ids - visited

    visited |= frontier
    all_ids = visited

    parts = Part.objects.filter(pk__in=all_ids).select_related("category")
    bom_items = BomItem.objects.filter(
        part_id__in=all_ids, sub_part_id__in=all_ids
    ).select_related("part", "sub_part")

    # Metrics for these parts
    metrics_qs = (
        BomItem.objects.filter(sub_part_id__in=all_ids)
        .values("sub_part_id")
        .annotate(
            parent_count=Count("part", distinct=True),
            occurrence_count=Count("id"),
            quantity_weighted=Sum("quantity"),
        )
    )
    metrics_by_part = {
        row["sub_part_id"]: {
            "parent_count": row["parent_count"],
            "occurrence_count": row["occurrence_count"],
            "quantity_weighted": float(row["quantity_weighted"] or 0),
        }
        for row in metrics_qs
    }

    nodes = []
    for part in parts:
        m = metrics_by_part.get(part.pk, {})
        nodes.append(
            {
                "id": part.pk,
                "name": part.name,
                "ipn": part.IPN or "",
                "category": part.category.pathstring if part.category else "",
                "category_id": part.category_id,
                "active": part.active,
                "purchaseable": part.purchaseable,
                "assembly": part.assembly,
                "parent_count": m.get("parent_count", 0),
                "occurrence_count": m.get("occurrence_count", 0),
                "quantity_weighted": m.get("quantity_weighted", 0),
            }
        )

    edges = [
        {
            "source": item.part_id,
            "target": item.sub_part_id,
            "quantity": float(item.quantity),
        }
        for item in bom_items
    ]

    return {
        "nodes": nodes,
        "edges": edges,
        "center_part_id": part_id,
        "depth": depth,
    }


def get_part_detail(part_id: int) -> dict | None:
    """Get detailed info for a single part."""
    try:
        part = Part.objects.select_related("category").get(pk=part_id)
    except Part.DoesNotExist:
        return None

    # Count direct parents and children
    parent_count = BomItem.objects.filter(sub_part=part).values("part").distinct().count()
    child_count = BomItem.objects.filter(part=part).values("sub_part").distinct().count()

    # Metrics
    metrics = (
        BomItem.objects.filter(sub_part=part)
        .aggregate(
            occurrence_count=Count("id"),
            quantity_weighted=Sum("quantity"),
        )
    )

    return {
        "id": part.pk,
        "name": part.name,
        "ipn": part.IPN or "",
        "category": part.category.pathstring if part.category else "",
        "category_id": part.category_id,
        "active": part.active,
        "purchaseable": part.purchaseable,
        "assembly": part.assembly,
        "parent_count": parent_count,
        "child_count": child_count,
        "occurrence_count": metrics["occurrence_count"] or 0,
        "quantity_weighted": float(metrics["quantity_weighted"] or 0),
    }


def invalidate_cache():
    """Invalidate all partsgraph cache entries."""
    # Django's default cache doesn't support pattern deletion,
    # so we use a version key approach
    cache.delete("partsgraph:version")
