"""Tests for resolve-screen.py -- screen mnemonic resolution."""

import json
import sys

import pytest

from tests.helpers import write_vault_index, write_table_md


# ---------------------------------------------------------------------------
# find_screen_folder
# ---------------------------------------------------------------------------

class TestFindScreenFolder:
    def test_finds_folder_with_files(self, resolve_screen_mod, tmp_project):
        screen_dir = tmp_project / "screens" / "cpisep"
        screen_dir.mkdir(parents=True)
        (screen_dir / "cpisep_fmb.xml").write_text("<xml/>")
        (screen_dir / "cpisep-fmb-analysis.md").write_text("# Analysis")
        (screen_dir / "cpisep-screen-analysis.md").write_text("# Screen")
        (screen_dir / "legacy.png").write_bytes(b"\x89PNG")
        (screen_dir / "figma-main.png").write_bytes(b"\x89PNG")
        (screen_dir / "notes.txt").write_text("notes")

        result = resolve_screen_mod.find_screen_folder(tmp_project, "cpisep")

        assert result is not None
        assert result["path"] == str(screen_dir)
        assert result["fmb_xml"] == str(screen_dir / "cpisep_fmb.xml")
        assert result["fmb_analysis"] == str(screen_dir / "cpisep-fmb-analysis.md")
        assert result["screen_analysis"] == str(screen_dir / "cpisep-screen-analysis.md")
        assert result["legacy_screenshot"] == str(screen_dir / "legacy.png")
        assert len(result["figma_screenshots"]) == 1
        assert len(result["other_files"]) == 1

    def test_missing_folder_returns_none(self, resolve_screen_mod, tmp_project):
        result = resolve_screen_mod.find_screen_folder(tmp_project, "nonexistent")
        assert result is None

    def test_empty_folder(self, resolve_screen_mod, tmp_project):
        screen_dir = tmp_project / "screens" / "empty"
        screen_dir.mkdir(parents=True)

        result = resolve_screen_mod.find_screen_folder(tmp_project, "empty")

        assert result is not None
        assert result["fmb_xml"] is None
        assert result["fmb_analysis"] is None
        assert result["screen_analysis"] is None
        assert result["legacy_screenshot"] is None
        assert result["figma_screenshots"] == []
        assert result["other_files"] == []

    def test_ignores_dotfiles(self, resolve_screen_mod, tmp_project):
        screen_dir = tmp_project / "screens" / "test_scr"
        screen_dir.mkdir(parents=True)
        (screen_dir / ".DS_Store").write_text("")
        (screen_dir / "real_file.txt").write_text("data")

        result = resolve_screen_mod.find_screen_folder(tmp_project, "test_scr")

        assert len(result["other_files"]) == 1

    def test_bak_screen_analysis_excluded(self, resolve_screen_mod, tmp_project):
        screen_dir = tmp_project / "screens" / "bak_test"
        screen_dir.mkdir(parents=True)
        (screen_dir / "bak_test-screen-analysis.bak.md").write_text("backup")
        (screen_dir / "bak_test-screen-analysis.md").write_text("current")

        result = resolve_screen_mod.find_screen_folder(tmp_project, "bak_test")

        assert result["screen_analysis"] == str(screen_dir / "bak_test-screen-analysis.md")


# ---------------------------------------------------------------------------
# find_vault_entry
# ---------------------------------------------------------------------------

class TestFindVaultEntry:
    def test_finds_by_entity_key(self, resolve_screen_mod, tmp_project):
        entities = {
            "cpisep": {
                "type": "screen",
                "title": "Component Separation",
                "module": "Lab",
                "sub_module": "Processing",
                "file_path": "screens/cpisep.md",
                "relationships": {"tables": ["COMPONENTS"]},
            },
        }
        write_vault_index(tmp_project, entities)

        result = resolve_screen_mod.find_vault_entry(tmp_project, "cpisep")

        assert result is not None
        assert result["title"] == "Component Separation"
        assert "absolute_path" in result

    def test_finds_by_mnemonic_field(self, resolve_screen_mod, tmp_project):
        entities = {
            "Component Separation": {
                "type": "screen",
                "mnemonic": "cpisep",
                "title": "Component Separation",
                "module": "Lab",
                "file_path": "screens/cpisep.md",
            },
        }
        write_vault_index(tmp_project, entities)

        result = resolve_screen_mod.find_vault_entry(tmp_project, "cpisep")

        assert result is not None
        assert result["title"] == "Component Separation"

    def test_not_found(self, resolve_screen_mod, tmp_project):
        entities = {
            "other_screen": {
                "type": "screen",
                "title": "Other",
                "file_path": "screens/other.md",
            },
        }
        write_vault_index(tmp_project, entities)

        result = resolve_screen_mod.find_vault_entry(tmp_project, "nonexistent")
        assert result is None

    def test_skips_non_screen_type(self, resolve_screen_mod, tmp_project):
        entities = {
            "cpisep": {
                "type": "table",
                "title": "Component Separation",
                "file_path": "tables/cpisep.md",
            },
        }
        write_vault_index(tmp_project, entities)

        result = resolve_screen_mod.find_vault_entry(tmp_project, "cpisep")
        assert result is None

    def test_missing_vault_index(self, resolve_screen_mod, tmp_path):
        result = resolve_screen_mod.find_vault_entry(tmp_path, "anything")
        assert result is None


# ---------------------------------------------------------------------------
# find_table_ddl_paths
# ---------------------------------------------------------------------------

class TestFindTableDdlPaths:
    def test_finds_tables(self, resolve_screen_mod, tmp_project):
        write_table_md(tmp_project, "BM", "DONORS", "# DONORS")
        write_table_md(tmp_project, "BM", "DONATIONS", "# DONATIONS")

        result = resolve_screen_mod.find_table_ddl_paths(
            tmp_project, ["DONORS", "DONATIONS"]
        )

        assert result["DONORS"] is not None
        assert result["DONATIONS"] is not None

    def test_missing_tables(self, resolve_screen_mod, tmp_project):
        result = resolve_screen_mod.find_table_ddl_paths(
            tmp_project, ["NONEXISTENT"]
        )
        assert result["NONEXISTENT"] is None

    def test_no_devdb_dir(self, resolve_screen_mod, tmp_path):
        result = resolve_screen_mod.find_table_ddl_paths(tmp_path, ["ANY"])
        assert result == {}


# ---------------------------------------------------------------------------
# find_fmb_in_oracle_app
# ---------------------------------------------------------------------------

class TestFindFmbInOracleApp:
    def test_finds_fmb_xml(self, resolve_screen_mod, tmp_project):
        oracle_dir = tmp_project / "knowledge" / "oracle-app" / "forms"
        oracle_dir.mkdir(parents=True)
        fmb_file = oracle_dir / "cpisep_fmb.xml"
        fmb_file.write_text("<xml/>")

        result = resolve_screen_mod.find_fmb_in_oracle_app(tmp_project, "cpisep")
        assert result == str(fmb_file)

    def test_not_found(self, resolve_screen_mod, tmp_project):
        result = resolve_screen_mod.find_fmb_in_oracle_app(tmp_project, "nonexistent")
        assert result is None

    def test_no_oracle_app_dir(self, resolve_screen_mod, tmp_path):
        result = resolve_screen_mod.find_fmb_in_oracle_app(tmp_path, "anything")
        assert result is None


# ---------------------------------------------------------------------------
# extract_table_names_from_vault
# ---------------------------------------------------------------------------

class TestExtractTableNamesFromVault:
    def test_extracts_tables_and_lov_sources(self, resolve_screen_mod):
        entry = {
            "relationships": {
                "tables": ["DONORS", "DONATIONS"],
                "lov_sources": ["CODES"],
                "read_write_screens": ["other_screen"],
            },
        }
        tables = resolve_screen_mod.extract_table_names_from_vault(entry)
        assert set(tables) == {"DONORS", "DONATIONS", "CODES"}

    def test_excludes_read_write_screens(self, resolve_screen_mod):
        entry = {
            "relationships": {
                "tables": [],
                "read_write_screens": ["scr1"],
            },
        }
        tables = resolve_screen_mod.extract_table_names_from_vault(entry)
        assert tables == []

    def test_none_entry(self, resolve_screen_mod):
        tables = resolve_screen_mod.extract_table_names_from_vault(None)
        assert tables == []

    def test_deduplicates(self, resolve_screen_mod):
        entry = {
            "relationships": {
                "tables": ["T1", "T1"],
                "lov_sources": ["T1"],
            },
        }
        tables = resolve_screen_mod.extract_table_names_from_vault(entry)
        assert tables == ["T1"]


# ---------------------------------------------------------------------------
# CLI / main -- full manifest generation
# ---------------------------------------------------------------------------

class TestResolveScreenCli:
    def _run_main(self, mod, project_root, mnemonic, monkeypatch):
        import io
        argv = ["prog", str(project_root), mnemonic]
        monkeypatch.setattr(sys, "argv", argv)

        old_stdout = sys.stdout
        sys.stdout = io.StringIO()
        exit_code = 0
        try:
            mod.main()
        except SystemExit as e:
            exit_code = e.code or 0
        finally:
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout

        return json.loads(output), exit_code

    def test_full_manifest_with_data(self, resolve_screen_mod, tmp_project, monkeypatch):
        # Set up screen folder
        screen_dir = tmp_project / "screens" / "cpisep"
        screen_dir.mkdir(parents=True)
        (screen_dir / "cpisep_fmb.xml").write_text("<xml/>")

        # Set up vault entry
        entities = {
            "cpisep": {
                "type": "screen",
                "title": "Component Separation",
                "module": "Lab",
                "sub_module": "Processing",
                "file_path": "screens/cpisep.md",
                "relationships": {"tables": ["COMPONENTS"]},
            },
        }
        write_vault_index(tmp_project, entities)

        # Set up table DDL
        write_table_md(tmp_project, "BM", "COMPONENTS", "# COMPONENTS")

        result, exit_code = self._run_main(
            resolve_screen_mod, tmp_project, "cpisep", monkeypatch,
        )

        assert exit_code == 0
        assert result["mnemonic"] == "cpisep"
        assert result["screen_folder"] is not None
        assert result["vault_entry"] is not None
        assert "COMPONENTS" in result["referenced_tables"]
        assert "COMPONENTS" in result["table_ddl_paths"]

    def test_manifest_json_keys(self, resolve_screen_mod, tmp_project, monkeypatch):
        entities = {"test": {"type": "screen", "title": "T", "file_path": "t.md"}}
        write_vault_index(tmp_project, entities)

        result, _ = self._run_main(
            resolve_screen_mod, tmp_project, "test", monkeypatch,
        )

        expected_keys = {
            "mnemonic", "project_root", "screen_folder", "vault_entry",
            "referenced_tables", "table_ddl_paths", "fmb_xml_oracle_app",
        }
        assert set(result.keys()) == expected_keys

    def test_no_data_exits_1(self, resolve_screen_mod, tmp_project, monkeypatch):
        write_vault_index(tmp_project, {})

        result, exit_code = self._run_main(
            resolve_screen_mod, tmp_project, "nonexistent", monkeypatch,
        )

        assert exit_code == 1
        assert result["screen_folder"] is None
        assert result["vault_entry"] is None

    def test_fmb_oracle_app_fallback(self, resolve_screen_mod, tmp_project, monkeypatch):
        """When no screen folder exists, should look in oracle-app."""
        oracle_dir = tmp_project / "knowledge" / "oracle-app" / "forms"
        oracle_dir.mkdir(parents=True)
        (oracle_dir / "cpisep_fmb.xml").write_text("<xml/>")

        entities = {
            "cpisep": {
                "type": "screen",
                "title": "Component Sep",
                "file_path": "t.md",
                "relationships": {},
            },
        }
        write_vault_index(tmp_project, entities)

        result, exit_code = self._run_main(
            resolve_screen_mod, tmp_project, "cpisep", monkeypatch,
        )

        assert exit_code == 0
        assert result["fmb_xml_oracle_app"] is not None
        assert "cpisep_fmb.xml" in result["fmb_xml_oracle_app"]

    def test_mnemonic_lowered(self, resolve_screen_mod, tmp_project, monkeypatch):
        entities = {
            "myscreen": {
                "type": "screen",
                "title": "My Screen",
                "file_path": "s.md",
            },
        }
        write_vault_index(tmp_project, entities)

        result, _ = self._run_main(
            resolve_screen_mod, tmp_project, "MYSCREEN", monkeypatch,
        )

        assert result["mnemonic"] == "myscreen"
