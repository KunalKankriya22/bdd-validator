"""Tests for list-screens.py -- vault index screen listing."""

import json
import sys

import pytest

from tests.helpers import write_vault_index


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_screen_entity(title, module, sub_module, mnemonic=None, tables=None, lov_sources=None):
    entity = {
        "type": "screen",
        "title": title,
        "module": module,
        "sub_module": sub_module,
        "relationships": {
            "tables": tables or [],
            "lov_sources": lov_sources or [],
        },
    }
    if mnemonic:
        entity["mnemonic"] = mnemonic
    return entity


def _run_main(mod, project_root, extra_args=None, monkeypatch=None):
    """Run main() capturing stdout JSON, returns parsed dict."""
    import io
    argv = ["prog", str(project_root)]
    if extra_args:
        argv.extend(extra_args)
    monkeypatch.setattr(sys, "argv", argv)

    old_stdout = sys.stdout
    sys.stdout = io.StringIO()
    try:
        mod.main()
    except SystemExit as e:
        if e.code not in (0, None):
            raise
    finally:
        output = sys.stdout.getvalue()
        sys.stdout = old_stdout

    return json.loads(output)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestListScreensBasic:
    def test_lists_all_screens(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "screen_a": _make_screen_entity("Screen A", "Donor", "Registration"),
            "screen_b": _make_screen_entity("Screen B", "Lab", "Testing"),
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(list_screens_mod, tmp_project, monkeypatch=monkeypatch)

        assert result["total_screens"] == 2
        assert len(result["screens"]) == 2

    def test_json_output_structure(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "test_scr": _make_screen_entity("Test", "Donor", "Entry"),
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(list_screens_mod, tmp_project, monkeypatch=monkeypatch)

        assert "total_screens" in result
        assert "screens_with_folders" in result
        assert "module_summary" in result
        assert "screens" in result

    def test_screen_entry_fields(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "donor_reg": _make_screen_entity(
                "Donor Registration", "Donor", "Registration",
                mnemonic="dnrreg", tables=["DONOR", "ADDRESS"],
            ),
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(list_screens_mod, tmp_project, monkeypatch=monkeypatch)

        screen = result["screens"][0]
        assert screen["mnemonic"] == "dnrreg"
        assert screen["title"] == "Donor Registration"
        assert screen["module"] == "Donor"
        assert screen["sub_module"] == "Registration"
        assert screen["table_count"] == 2

    def test_skips_non_screen_entities(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "real_screen": _make_screen_entity("Real", "Donor", "Entry"),
            "some_table": {"type": "table", "title": "Some Table"},
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(list_screens_mod, tmp_project, monkeypatch=monkeypatch)

        assert result["total_screens"] == 1

    def test_empty_vault_index(self, list_screens_mod, tmp_project, monkeypatch):
        write_vault_index(tmp_project, {})

        result = _run_main(list_screens_mod, tmp_project, monkeypatch=monkeypatch)

        assert result["total_screens"] == 0
        assert result["screens"] == []


class TestListScreensFiltering:
    def test_filter_by_module(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "s1": _make_screen_entity("S1", "Donor", "Reg"),
            "s2": _make_screen_entity("S2", "Lab", "Testing"),
            "s3": _make_screen_entity("S3", "Donor", "History"),
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(
            list_screens_mod, tmp_project,
            extra_args=["--module", "Donor"],
            monkeypatch=monkeypatch,
        )

        assert result["total_screens"] == 2
        assert all(s["module"] == "Donor" for s in result["screens"])

    def test_filter_by_submodule(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "s1": _make_screen_entity("S1", "Donor", "Registration"),
            "s2": _make_screen_entity("S2", "Donor", "History"),
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(
            list_screens_mod, tmp_project,
            extra_args=["--submodule", "History"],
            monkeypatch=monkeypatch,
        )

        assert result["total_screens"] == 1
        assert result["screens"][0]["sub_module"] == "History"

    def test_filter_by_search(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "cpisep": _make_screen_entity("Component Separation", "Lab", "Processing"),
            "dnrreg": _make_screen_entity("Donor Registration", "Donor", "Entry"),
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(
            list_screens_mod, tmp_project,
            extra_args=["--search", "separation"],
            monkeypatch=monkeypatch,
        )

        assert result["total_screens"] == 1
        assert result["screens"][0]["mnemonic"] == "cpisep"

    def test_search_no_matches(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "s1": _make_screen_entity("Screen One", "Donor", "Entry"),
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(
            list_screens_mod, tmp_project,
            extra_args=["--search", "zznonexistent"],
            monkeypatch=monkeypatch,
        )

        assert result["total_screens"] == 0


class TestListScreensWithFolder:
    def test_with_folder_flag(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "has_folder": _make_screen_entity("Has Folder", "Donor", "Entry", mnemonic="has_folder"),
            "no_folder": _make_screen_entity("No Folder", "Lab", "Test", mnemonic="no_folder"),
        }
        write_vault_index(tmp_project, entities)

        # Create the screen folder for one
        (tmp_project / "screens" / "has_folder").mkdir(parents=True, exist_ok=True)

        result = _run_main(
            list_screens_mod, tmp_project,
            extra_args=["--with-folder"],
            monkeypatch=monkeypatch,
        )

        assert result["total_screens"] == 1
        assert result["screens"][0]["has_working_folder"] is True

    def test_screens_with_folders_count(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "scr_a": _make_screen_entity("A", "Donor", "Reg", mnemonic="scr_a"),
            "scr_b": _make_screen_entity("B", "Lab", "Test", mnemonic="scr_b"),
        }
        write_vault_index(tmp_project, entities)
        (tmp_project / "screens" / "scr_a").mkdir(parents=True, exist_ok=True)

        result = _run_main(list_screens_mod, tmp_project, monkeypatch=monkeypatch)

        assert result["screens_with_folders"] == 1


class TestListScreensModuleSummary:
    def test_module_summary(self, list_screens_mod, tmp_project, monkeypatch):
        entities = {
            "s1": _make_screen_entity("S1", "Donor", "Reg"),
            "s2": _make_screen_entity("S2", "Donor", "History"),
            "s3": _make_screen_entity("S3", "Lab", "Testing"),
        }
        write_vault_index(tmp_project, entities)

        result = _run_main(list_screens_mod, tmp_project, monkeypatch=monkeypatch)

        assert "Donor" in result["module_summary"]
        assert result["module_summary"]["Donor"]["screen_count"] == 2
        assert set(result["module_summary"]["Donor"]["sub_modules"]) == {"Reg", "History"}
        assert result["module_summary"]["Lab"]["screen_count"] == 1


class TestListScreensMissingIndex:
    def test_missing_vault_index_exits_2(self, list_screens_mod, tmp_path, monkeypatch):
        # tmp_path has no vault index
        monkeypatch.setattr(sys, "argv", ["prog", str(tmp_path)])
        with pytest.raises(SystemExit) as exc_info:
            list_screens_mod.main()
        assert exc_info.value.code == 2
