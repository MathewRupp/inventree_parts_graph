"""InvenTree BOM Risk Graph Plugin."""

from plugin import InvenTreePlugin
from plugin.mixins import SettingsMixin, UrlsMixin, UserInterfaceMixin

from . import PLUGIN_VERSION
from .api import graph_data, metrics_options, part_detail, subgraph_data


class PartsGraphPlugin(SettingsMixin, UrlsMixin, UserInterfaceMixin, InvenTreePlugin):
    """Plugin providing an interactive BOM risk graph."""

    AUTHOR = "Mathew Rupp"
    DESCRIPTION = "Interactive BOM risk graph for identifying part reuse and supply-chain risk"
    VERSION = PLUGIN_VERSION
    MIN_VERSION = "0.12.0"
    NAME = "inventree-partsgraph"
    SLUG = "partsgraph"
    TITLE = "Part Risk Graph"

    SETTINGS = {
        "CACHE_TTL": {
            "name": "Cache TTL (seconds)",
            "description": "How long to cache graph data before recomputing",
            "default": 300,
        },
        "MAX_NODES": {
            "name": "Maximum Nodes",
            "description": "Maximum number of nodes to return in a single graph response",
            "default": 2000,
        },
        "DEFAULT_METRIC": {
            "name": "Default Metric",
            "description": "Default node-sizing metric (parent_count, occurrence_count, quantity_weighted)",
            "default": "parent_count",
        },
        "RISK_THRESHOLD_PERCENTILE": {
            "name": "Risk Threshold Percentile",
            "description": "Percentile above which nodes are highlighted as high-risk (0-100)",
            "default": 90,
        },
    }

    def get_ui_navigation_items(self, request, context, **kwargs):
        return [
            {
                "key": "partsgraph",
                "title": "Part Risk Graph",
                "icon": "ti:chart-dots-3:outline",
                "options": {"url": "/partsgraph/"},
                "source": self.plugin_static_file(
                    "PartRiskGraph.js:renderPartRiskGraph"
                ),
            }
        ]

    def get_ui_dashboard_items(self, request, context, **kwargs):
        return [
            {
                "key": "partsgraph-dashboard",
                "title": "Part Risk Graph",
                "description": "Interactive BOM risk graph for identifying part reuse and supply-chain risk",
                "source": self.plugin_static_file(
                    "PartRiskGraph.js:renderPartRiskGraph"
                ),
                "options": {"width": 12, "height": 6},
            }
        ]

    def setup_urls(self):
        from django.urls import path

        return [
            path("graph/data/", graph_data, name="partsgraph-graph-data"),
            path("graph/subgraph/", subgraph_data, name="partsgraph-subgraph"),
            path(
                "part/<int:part_id>/detail/",
                part_detail,
                name="partsgraph-part-detail",
            ),
            path(
                "metrics/options/",
                metrics_options,
                name="partsgraph-metrics-options",
            ),
        ]
