# JSON output pattern used by ALL 5 scripts:
#   json.dump(result, sys.stdout, indent=2)
#   print()   # trailing newline
#
# All scripts write JSON to sys.stdout via json.dump() followed by a bare
# print() to emit a final newline. Errors/diagnostics go to sys.stderr.

import json
from pathlib import Path

import pytest

from tests.helpers import load_script_module


# ---- cached module loaders ------------------------------------------------

@pytest.fixture(scope="session")
def extract_fmb_deps_mod():
    return load_script_module("extract-fmb-deps.py")


@pytest.fixture(scope="session")
def list_screens_mod():
    return load_script_module("list-screens.py")


@pytest.fixture(scope="session")
def lookup_tables_mod():
    return load_script_module("lookup-tables.py")


@pytest.fixture(scope="session")
def resolve_screen_mod():
    return load_script_module("resolve-screen.py")


@pytest.fixture(scope="session")
def search_knowledge_mod():
    return load_script_module("search-knowledge.py")


# ---- shared filesystem fixtures -------------------------------------------

@pytest.fixture
def tmp_project(tmp_path):
    """Create a minimal project root with standard directories."""
    (tmp_path / "knowledge" / ".sage-index").mkdir(parents=True)
    (tmp_path / "knowledge" / "devdb-docs" / "schemas").mkdir(parents=True)
    (tmp_path / "knowledge" / "obsidian-vault").mkdir(parents=True)
    (tmp_path / "knowledge" / "oracle-app").mkdir(parents=True)
    (tmp_path / "screens").mkdir()
    return tmp_path
