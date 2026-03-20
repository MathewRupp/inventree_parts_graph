"""Django views for graph API endpoints."""

import json

from django.http import JsonResponse
from django.views.decorators.http import require_GET

from InvenTree.helpers import str2bool

from .graph import (
    build_graph_data,
    get_categories,
    get_metric_options,
    get_part_detail,
    get_subgraph,
    invalidate_cache,
)


def _get_plugin_settings():
    """Get plugin settings from the database."""
    from plugin.registry import registry

    plugin = registry.get_plugin("partsgraph")
    if plugin is None:
        return {"cache_ttl": 300, "max_nodes": 2000, "risk_percentile": 90}

    return {
        "cache_ttl": int(plugin.get_setting("CACHE_TTL") or 300),
        "max_nodes": int(plugin.get_setting("MAX_NODES") or 2000),
        "risk_percentile": int(plugin.get_setting("RISK_THRESHOLD_PERCENTILE") or 90),
    }


@require_GET
def graph_data(request):
    """Return graph nodes, edges, and summary."""
    settings = _get_plugin_settings()

    active = str2bool(request.GET.get("active", "true"))
    category = request.GET.get("category")
    purchaseable = request.GET.get("purchaseable")
    assembly = request.GET.get("assembly")
    min_weight = float(request.GET.get("min_weight", 0))
    metric = request.GET.get("metric", "parent_count")
    search = request.GET.get("search", "").strip()

    data = build_graph_data(
        active=active,
        category=int(category) if category else None,
        purchaseable=str2bool(purchaseable) if purchaseable else None,
        assembly=str2bool(assembly) if assembly else None,
        min_weight=min_weight,
        metric=metric,
        search=search,
        max_nodes=settings["max_nodes"],
        cache_ttl=settings["cache_ttl"],
        risk_percentile=settings["risk_percentile"],
    )

    # Include categories for filter dropdown
    data["categories"] = get_categories()

    return JsonResponse(data)


@require_GET
def subgraph_data(request):
    """Return neighborhood subgraph around a part."""
    part_id = request.GET.get("part_id")
    if not part_id:
        return JsonResponse({"error": "part_id is required"}, status=400)

    depth = int(request.GET.get("depth", 2))
    active = str2bool(request.GET.get("active", "true"))

    data = get_subgraph(int(part_id), depth=depth, active=active)
    return JsonResponse(data)


@require_GET
def part_detail(request, part_id: int):
    """Return detail for a single part."""
    data = get_part_detail(part_id)
    if data is None:
        return JsonResponse({"error": "Part not found"}, status=404)
    return JsonResponse(data)


@require_GET
def metrics_options(request):
    """Return available metric modes."""
    return JsonResponse({"options": get_metric_options()})
