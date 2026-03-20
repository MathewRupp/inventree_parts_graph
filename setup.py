import setuptools

setuptools.setup(
    name="inventree-partsgraph-plugin",
    version="0.1.0",
    author="Mathew Rupp",
    description="Interactive BOM risk graph for InvenTree",
    packages=setuptools.find_packages(),
    include_package_data=True,
    install_requires=[],
    entry_points={
        "inventree_plugins": [
            "PartsGraphPlugin = inventree_partsgraph.partsgraph:PartsGraphPlugin"
        ]
    },
)
