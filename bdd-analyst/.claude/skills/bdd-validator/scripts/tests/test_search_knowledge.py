"""Tests for search-knowledge.py -- full-text knowledge base search."""

import json
import sys

import pytest

from tests.helpers import write_vault_index


# ---------------------------------------------------------------------------
# extract_snippet
# ---------------------------------------------------------------------------

class TestExtractSnippet:
    def test_returns_snippet_around_match(self, search_knowledge_mod):
        content = "line 0\nline 1\ndonor registration\nline 3\nline 4\n"
        snippet = search_knowledge_mod.extract_snippet(content, "donor")
        assert "donor registration" in snippet

    def test_includes_context_lines(self, search_knowledge_mod):
        lines = [f"line {i}" for i in range(10)]
        lines[5] = "target keyword here"
        content = "\n".join(lines)
        snippet = search_knowledge_mod.extract_snippet(content, "target")
        # Should include context lines around line 5
        assert "target keyword here" in snippet
        assert "line 3" in snippet or "line 4" in snippet

    def test_no_match_returns_first_line(self, search_knowledge_mod):
        content = "first line\nsecond line\n"
        snippet = search_knowledge_mod.extract_snippet(content, "zzz_no_match")
        assert snippet == "first line"

    def test_empty_content(self, search_knowledge_mod):
        snippet = search_knowledge_mod.extract_snippet("", "anything")
        assert snippet == ""

    def test_long_snippet_truncated(self, search_knowledge_mod):
        long_line = "x" * 600
        content = f"before\n{long_line} match_word rest\nafter\n"
        snippet = search_knowledge_mod.extract_snippet(content, "match_word")
        assert len(snippet) <= 503  # 500 + "..."
        assert snippet.endswith("...")


# ---------------------------------------------------------------------------
# search_vault_index
# ---------------------------------------------------------------------------

class TestSearchVaultIndex:
    def test_finds_matching_entities(self, search_knowledge_mod, tmp_project):
        entities = {
            "cpisep": {
                "type": "screen",
                "title": "Component Separation",
                "mnemonic": "cpisep",
                "module": "Lab",
                "sub_module": "Processing",
                "file_path": "screens/cpisep.md",
                "tags": [],
            },
            "dnrreg": {
                "type": "screen",
                "title": "Donor Registration",
                "mnemonic": "dnrreg",
                "module": "Donor",
                "sub_module": "Entry",
                "file_path": "screens/dnrreg.md",
                "tags": [],
            },
        }
        write_vault_index(tmp_project, entities)

        results = search_knowledge_mod.search_vault_index(tmp_project, "donor")

        assert len(results) >= 1
        assert results[0]["source"] == "vault-index"
        assert results[0]["entity_name"] == "dnrreg"

    def test_exact_name_match_scores_higher(self, search_knowledge_mod, tmp_project):
        entities = {
            "cpisep": {
                "type": "screen",
                "title": "Component Separation",
                "mnemonic": "cpisep",
                "module": "Lab",
                "sub_module": "Processing",
                "file_path": "s.md",
                "tags": [],
            },
            "other": {
                "type": "screen",
                "title": "Has cpisep in title",
                "mnemonic": "other",
                "module": "Lab",
                "sub_module": "Other",
                "file_path": "o.md",
                "tags": [],
            },
        }
        write_vault_index(tmp_project, entities)

        results = search_knowledge_mod.search_vault_index(tmp_project, "cpisep")

        # The exact mnemonic match should score higher
        assert results[0]["entity_name"] == "cpisep"
        assert results[0]["score"] > results[1]["score"]

    def test_no_matches(self, search_knowledge_mod, tmp_project):
        entities = {
            "screen_a": {
                "type": "screen",
                "title": "Screen A",
                "mnemonic": "scra",
                "module": "Donor",
                "file_path": "a.md",
            },
        }
        write_vault_index(tmp_project, entities)

        results = search_knowledge_mod.search_vault_index(tmp_project, "zzz_no_match")
        assert results == []

    def test_missing_index_file(self, search_knowledge_mod, tmp_path):
        results = search_knowledge_mod.search_vault_index(tmp_path, "anything")
        assert results == []

    def test_result_structure(self, search_knowledge_mod, tmp_project):
        entities = {
            "test": {
                "type": "screen",
                "title": "Test Screen",
                "mnemonic": "test",
                "module": "Donor",
                "sub_module": "Entry",
                "file_path": "screens/test.md",
                "tags": ["donor"],
            },
        }
        write_vault_index(tmp_project, entities)

        results = search_knowledge_mod.search_vault_index(tmp_project, "test")

        assert len(results) >= 1
        r = results[0]
        assert "source" in r
        assert "entity_name" in r
        assert "type" in r
        assert "title" in r
        assert "module" in r
        assert "file_path" in r
        assert "score" in r
        assert "snippet" in r

    def test_limits_to_max_results(self, search_knowledge_mod, tmp_project):
        entities = {}
        for i in range(30):
            entities[f"donor_{i}"] = {
                "type": "screen",
                "title": f"Donor Screen {i}",
                "mnemonic": f"donor_{i}",
                "module": "Donor",
                "file_path": f"s/{i}.md",
            }
        write_vault_index(tmp_project, entities)

        results = search_knowledge_mod.search_vault_index(tmp_project, "donor")
        assert len(results) <= 20


# ---------------------------------------------------------------------------
# search_files
# ---------------------------------------------------------------------------

class TestSearchFiles:
    def test_finds_matching_files(self, search_knowledge_mod, tmp_project):
        md_dir = tmp_project / "screens" / "test_dir"
        md_dir.mkdir(parents=True)
        (md_dir / "donor-analysis.md").write_text("# Donor Registration\n\nThis is about donor management.")
        (md_dir / "lab-analysis.md").write_text("# Lab Testing\n\nLaboratory workflow.")

        results = search_knowledge_mod.search_files(
            tmp_project / "screens", "donor", (".md",), "screen-analysis",
        )

        assert len(results) >= 1
        assert results[0]["source"] == "screen-analysis"
        assert "donor" in results[0]["file_name"].lower() or results[0]["score"] > 0

    def test_filename_match_bonus(self, search_knowledge_mod, tmp_project):
        md_dir = tmp_project / "screens" / "testdir"
        md_dir.mkdir(parents=True)
        (md_dir / "donor.md").write_text("donor info here")
        (md_dir / "other.md").write_text("donor info here too")

        results = search_knowledge_mod.search_files(
            tmp_project / "screens", "donor", (".md",), "test",
        )

        # The file named "donor.md" should score higher due to filename bonus
        donor_results = [r for r in results if "donor" in r["file_name"].lower()]
        other_results = [r for r in results if "other" in r["file_name"].lower()]
        if donor_results and other_results:
            assert donor_results[0]["score"] > other_results[0]["score"]

    def test_no_matches(self, search_knowledge_mod, tmp_project):
        md_dir = tmp_project / "screens" / "testdir2"
        md_dir.mkdir(parents=True)
        (md_dir / "file.md").write_text("nothing relevant")

        results = search_knowledge_mod.search_files(
            tmp_project / "screens", "zzz_no_match", (".md",), "test",
        )

        assert results == []

    def test_missing_directory(self, search_knowledge_mod, tmp_path):
        results = search_knowledge_mod.search_files(
            tmp_path / "nonexistent", "query", (".md",), "test",
        )
        assert results == []

    def test_filters_by_extension(self, search_knowledge_mod, tmp_project):
        md_dir = tmp_project / "screens" / "ext_test"
        md_dir.mkdir(parents=True)
        (md_dir / "data.md").write_text("keyword here")
        (md_dir / "data.txt").write_text("keyword here too")

        results = search_knowledge_mod.search_files(
            tmp_project / "screens", "keyword", (".md",), "test",
        )

        file_names = [r["file_name"] for r in results]
        assert "data.md" in file_names
        assert "data.txt" not in file_names


# ---------------------------------------------------------------------------
# search_sage_indexes
# ---------------------------------------------------------------------------

class TestSearchSageIndexes:
    def test_finds_matching_sections(self, search_knowledge_mod, tmp_project):
        sage_dir = tmp_project / "knowledge" / ".sage-index"
        sage_dir.mkdir(parents=True, exist_ok=True)

        index_data = {
            "file": "donor-manual.pdf",
            "file_path": "/docs/donor-manual.pdf",
            "sections": [
                {"heading": "Donor Registration Procedures", "page": 5},
                {"heading": "Lab Testing Protocols", "page": 20},
            ],
        }
        (sage_dir / "donor-manual.index.json").write_text(json.dumps(index_data))

        results = search_knowledge_mod.search_sage_indexes(tmp_project, "donor")

        assert len(results) == 1
        assert results[0]["source"] == "pdf-index"
        assert results[0]["section"] == "Donor Registration Procedures"
        assert results[0]["page"] == 5

    def test_skips_vault_index(self, search_knowledge_mod, tmp_project):
        sage_dir = tmp_project / "knowledge" / ".sage-index"
        # vault.index.json should be skipped by search_sage_indexes
        vault_data = {
            "entities": {
                "donor": {"type": "screen", "title": "Donor"},
            },
        }
        (sage_dir / "vault.index.json").write_text(json.dumps(vault_data))

        results = search_knowledge_mod.search_sage_indexes(tmp_project, "donor")
        # Should return nothing -- vault.index.json is skipped
        assert results == []

    def test_no_matches(self, search_knowledge_mod, tmp_project):
        sage_dir = tmp_project / "knowledge" / ".sage-index"
        index_data = {
            "file": "manual.pdf",
            "sections": [{"heading": "Introduction", "page": 1}],
        }
        (sage_dir / "manual.index.json").write_text(json.dumps(index_data))

        results = search_knowledge_mod.search_sage_indexes(tmp_project, "zzz_no_match")
        assert results == []

    def test_missing_sage_dir(self, search_knowledge_mod, tmp_path):
        results = search_knowledge_mod.search_sage_indexes(tmp_path, "anything")
        assert results == []

    def test_malformed_json_skipped(self, search_knowledge_mod, tmp_project):
        sage_dir = tmp_project / "knowledge" / ".sage-index"
        (sage_dir / "bad.index.json").write_text("{invalid json")

        # Should not crash
        results = search_knowledge_mod.search_sage_indexes(tmp_project, "test")
        assert results == []


# ---------------------------------------------------------------------------
# CLI / main
# ---------------------------------------------------------------------------

class TestSearchKnowledgeCli:
    def _run_main(self, mod, project_root, query, extra_args=None, monkeypatch=None):
        import io
        argv = ["prog", str(project_root), query]
        if extra_args:
            argv.extend(extra_args)
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

    def test_full_search_with_results(self, search_knowledge_mod, tmp_project, monkeypatch):
        entities = {
            "cpisep": {
                "type": "screen",
                "title": "Component Separation",
                "mnemonic": "cpisep",
                "module": "Lab",
                "file_path": "s.md",
            },
        }
        write_vault_index(tmp_project, entities)

        result, exit_code = self._run_main(
            search_knowledge_mod, tmp_project, "component", monkeypatch=monkeypatch,
        )

        assert exit_code == 0
        assert result["query"] == "component"
        assert result["total_matches"] >= 1
        assert result["results_returned"] >= 1
        assert len(result["results"]) >= 1

    def test_json_output_structure(self, search_knowledge_mod, tmp_project, monkeypatch):
        write_vault_index(tmp_project, {})

        result, _ = self._run_main(
            search_knowledge_mod, tmp_project, "test", monkeypatch=monkeypatch,
        )

        assert "query" in result
        assert "total_matches" in result
        assert "results_returned" in result
        assert "results" in result

    def test_no_results_exits_1(self, search_knowledge_mod, tmp_project, monkeypatch):
        write_vault_index(tmp_project, {})

        result, exit_code = self._run_main(
            search_knowledge_mod, tmp_project, "zzz_impossible_query",
            monkeypatch=monkeypatch,
        )

        assert exit_code == 1
        assert result["total_matches"] == 0

    def test_max_results_flag(self, search_knowledge_mod, tmp_project, monkeypatch):
        entities = {}
        for i in range(15):
            entities[f"donor_{i}"] = {
                "type": "screen",
                "title": f"Donor Screen {i}",
                "mnemonic": f"donor_{i}",
                "module": "Donor",
                "file_path": f"s/{i}.md",
            }
        write_vault_index(tmp_project, entities)

        result, _ = self._run_main(
            search_knowledge_mod, tmp_project, "donor",
            extra_args=["--max-results", "5"],
            monkeypatch=monkeypatch,
        )

        assert result["results_returned"] <= 5
        assert len(result["results"]) <= 5

    def test_results_sorted_by_score(self, search_knowledge_mod, tmp_project, monkeypatch):
        entities = {
            "donor": {
                "type": "screen",
                "title": "Donor",
                "mnemonic": "donor",
                "module": "Donor",
                "file_path": "d.md",
            },
            "other": {
                "type": "screen",
                "title": "Other with donor word",
                "mnemonic": "other",
                "module": "Lab",
                "file_path": "o.md",
            },
        }
        write_vault_index(tmp_project, entities)

        result, _ = self._run_main(
            search_knowledge_mod, tmp_project, "donor", monkeypatch=monkeypatch,
        )

        if len(result["results"]) >= 2:
            scores = [r["score"] for r in result["results"]]
            assert scores == sorted(scores, reverse=True)

    def test_multi_source_results(self, search_knowledge_mod, tmp_project, monkeypatch):
        # Vault entry
        entities = {
            "donor_scr": {
                "type": "screen",
                "title": "Donor Screen",
                "mnemonic": "donor_scr",
                "module": "Donor",
                "file_path": "d.md",
            },
        }
        write_vault_index(tmp_project, entities)

        # Screen analysis file
        screen_dir = tmp_project / "screens" / "test_dir"
        screen_dir.mkdir(parents=True)
        (screen_dir / "donor-analysis.md").write_text("# Donor Screen Analysis\n\nDonor details here.")

        result, _ = self._run_main(
            search_knowledge_mod, tmp_project, "donor", monkeypatch=monkeypatch,
        )

        sources = {r["source"] for r in result["results"]}
        assert "vault-index" in sources
