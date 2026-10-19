"""Tests for extract-fmb-deps.py -- FMB XML dependency extraction."""

import json
import sys
from pathlib import Path

import pytest

from tests.helpers import make_minimal_fmb_xml


# ---------------------------------------------------------------------------
# extract_packages
# ---------------------------------------------------------------------------

class TestExtractPackages:
    def test_finds_package_procedure_calls(self, extract_fmb_deps_mod):
        code = ["MY_PKG.DO_THING(param1);", "MY_PKG.DO_THING(param2);"]
        result = extract_fmb_deps_mod.extract_packages(code, [])
        assert len(result) == 1
        assert result[0]["package"] == "MY_PKG"
        assert result[0]["procedure"] == "DO_THING"
        assert result[0]["call_count"] == 2

    def test_ignores_builtin_packages(self, extract_fmb_deps_mod):
        code = [
            "SYSTEM.some_func(x);",
            "SET_ITEM_PROPERTY.foo(y);",
            "NAME_IN.bar(z);",
        ]
        result = extract_fmb_deps_mod.extract_packages(code, [])
        assert result == []

    def test_case_insensitive_matching(self, extract_fmb_deps_mod):
        code = ["my_pkg.my_proc(x);"]
        result = extract_fmb_deps_mod.extract_packages(code, [])
        assert len(result) == 1
        assert result[0]["package"] == "MY_PKG"
        assert result[0]["procedure"] == "MY_PROC"

    def test_merges_code_from_both_sources(self, extract_fmb_deps_mod):
        pu_code = ["PKG_A.PROC_1(x);"]
        trigger_code = ["PKG_B.PROC_2(y);"]
        result = extract_fmb_deps_mod.extract_packages(pu_code, trigger_code)
        packages = {r["package"] for r in result}
        assert packages == {"PKG_A", "PKG_B"}

    def test_empty_input(self, extract_fmb_deps_mod):
        result = extract_fmb_deps_mod.extract_packages([], [])
        assert result == []

    def test_sorted_by_call_count_descending(self, extract_fmb_deps_mod):
        code = [
            "PKG_A.PROC(x);",
            "PKG_B.PROC(x);",
            "PKG_B.PROC(y);",
            "PKG_B.PROC(z);",
        ]
        result = extract_fmb_deps_mod.extract_packages(code, [])
        assert result[0]["package"] == "PKG_B"
        assert result[0]["call_count"] == 3
        assert result[1]["package"] == "PKG_A"
        assert result[1]["call_count"] == 1


# ---------------------------------------------------------------------------
# extract_procedure_calls
# ---------------------------------------------------------------------------

class TestExtractProcedureCalls:
    def test_finds_standalone_procedures(self, extract_fmb_deps_mod):
        code = ["  my_procedure(param1);"]
        result = extract_fmb_deps_mod.extract_procedure_calls(code, [])
        names = [r["name"] for r in result]
        assert "my_procedure" in names

    def test_ignores_builtins(self, extract_fmb_deps_mod):
        code = ["  substr(x, 1, 5);", "  to_char(sysdate);"]
        result = extract_fmb_deps_mod.extract_procedure_calls(code, [])
        names = [r["name"] for r in result]
        assert "substr" not in names
        assert "to_char" not in names

    def test_limits_to_30_results(self, extract_fmb_deps_mod):
        lines = [f"  proc_{i}(x);" for i in range(50)]
        result = extract_fmb_deps_mod.extract_procedure_calls(lines, [])
        assert len(result) <= 30

    def test_empty_input(self, extract_fmb_deps_mod):
        result = extract_fmb_deps_mod.extract_procedure_calls([], [])
        assert result == []


# ---------------------------------------------------------------------------
# extract_screen_calls
# ---------------------------------------------------------------------------

class TestExtractScreenCalls:
    def test_finds_call_form(self, extract_fmb_deps_mod):
        code = ["CALL_FORM('donor_entry');"]
        result = extract_fmb_deps_mod.extract_screen_calls(code, [])
        assert len(result) == 1
        assert result[0]["call_type"] == "CALL_FORM"
        assert result[0]["form_name"] == "donor_entry"

    def test_finds_open_form_and_new_form(self, extract_fmb_deps_mod):
        code = [
            'OPEN_FORM("form_a");',
            "NEW_FORM('form_b');",
        ]
        result = extract_fmb_deps_mod.extract_screen_calls(code, [])
        types = {r["call_type"] for r in result}
        assert types == {"OPEN_FORM", "NEW_FORM"}

    def test_deduplicates(self, extract_fmb_deps_mod):
        code = [
            "CALL_FORM('form_x');",
            "CALL_FORM('form_x');",
        ]
        result = extract_fmb_deps_mod.extract_screen_calls(code, [])
        assert len(result) == 1

    def test_empty_input(self, extract_fmb_deps_mod):
        result = extract_fmb_deps_mod.extract_screen_calls([], [])
        assert result == []


# ---------------------------------------------------------------------------
# extract_error_codes
# ---------------------------------------------------------------------------

class TestExtractErrorCodes:
    def test_finds_error_codes(self, extract_fmb_deps_mod):
        code = ["show_error('12345');", "handle_error('9999');"]
        result = extract_fmb_deps_mod.extract_error_codes(code, [])
        assert "12345" in result
        assert "9999" in result

    def test_deduplicates_and_sorts(self, extract_fmb_deps_mod):
        code = [
            "show_error('1001');",
            "show_error('1001');",
            "handle_error('1000');",
        ]
        result = extract_fmb_deps_mod.extract_error_codes(code, [])
        assert result == ["1000", "1001"]

    def test_no_matches(self, extract_fmb_deps_mod):
        code = ["some_other_func('hello');"]
        result = extract_fmb_deps_mod.extract_error_codes(code, [])
        assert result == []


# ---------------------------------------------------------------------------
# parse_fmb_xml
# ---------------------------------------------------------------------------

class TestParseFmbXml:
    def test_basic_form_parsing(self, extract_fmb_deps_mod, tmp_path):
        xml = make_minimal_fmb_xml(
            form_name="DONOR_FORM",
            form_title="Donor Entry",
            blocks=[
                {"Name": "DONOR_BLK", "DatabaseBlock": "true",
                 "DataSourceName": "DONORS", "_items": 3},
            ],
        )
        fmb_file = tmp_path / "donor_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)

        assert result["form_name"] == "DONOR_FORM"
        assert result["form_title"] == "Donor Entry"
        assert len(result["blocks"]) == 1
        assert result["blocks"][0]["name"] == "DONOR_BLK"
        assert result["blocks"][0]["is_database_block"] is True
        assert result["blocks"][0]["data_source"] == "DONORS"
        assert result["blocks"][0]["item_count"] == 3
        assert "DONORS" in result["database_tables"]

    def test_trigger_extraction(self, extract_fmb_deps_mod, tmp_path):
        xml = make_minimal_fmb_xml(
            triggers=[
                {"Name": "ON-INSERT", "TriggerType": "block",
                 "TriggerText": "MY_PKG.INSERT_ROW(param);"},
            ],
        )
        fmb_file = tmp_path / "test_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)

        assert result["triggers"]["count"] == 1
        assert result["triggers"]["items"][0]["name"] == "ON-INSERT"
        assert result["triggers"]["items"][0]["has_code"] is True
        # Should pick up the package call from trigger code
        assert any(p["package"] == "MY_PKG" for p in result["oracle_packages"])

    def test_program_unit_extraction(self, extract_fmb_deps_mod, tmp_path):
        xml = make_minimal_fmb_xml(
            program_units=[
                {"Name": "HELPER_PROC", "ProgramUnitType": "procedure",
                 "ProgramUnitText": "PKG_UTIL.DO_SOMETHING(x);"},
            ],
        )
        fmb_file = tmp_path / "test_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)

        assert result["program_units"]["count"] == 1
        assert result["program_units"]["items"][0]["name"] == "HELPER_PROC"
        assert any(p["package"] == "PKG_UTIL" for p in result["oracle_packages"])

    def test_lov_query_extraction(self, extract_fmb_deps_mod, tmp_path):
        xml = make_minimal_fmb_xml(
            record_groups=[
                {"Name": "RG_DONORS", "RecordGroupType": "query",
                 "RecordGroupQuery": "SELECT * FROM DONORS WHERE active = 1"},
            ],
        )
        fmb_file = tmp_path / "test_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)

        assert len(result["lov_queries"]) == 1
        assert result["lov_queries"][0]["name"] == "RG_DONORS"
        assert "DONORS" in result["lov_queries"][0]["tables_referenced"]
        assert "DONORS" in result["database_tables"]

    def test_inherited_blocks(self, extract_fmb_deps_mod, tmp_path):
        xml = make_minimal_fmb_xml(
            blocks=[
                {"Name": "CHILD_BLK", "ParentModule": "BASE_MODULE",
                 "ParentName": "PARENT_BLK"},
            ],
        )
        fmb_file = tmp_path / "test_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)

        assert len(result["inherited_blocks"]) == 1
        assert result["inherited_blocks"][0]["parent_module"] == "BASE_MODULE"

    def test_screen_navigation_extraction(self, extract_fmb_deps_mod, tmp_path):
        xml = make_minimal_fmb_xml(
            triggers=[
                {"Name": "NAV_TRIGGER", "TriggerType": "key",
                 "TriggerText": "CALL_FORM('other_screen');"},
            ],
        )
        fmb_file = tmp_path / "test_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)

        assert len(result["screen_navigation"]) == 1
        assert result["screen_navigation"][0]["form_name"] == "other_screen"

    def test_empty_form(self, extract_fmb_deps_mod, tmp_path):
        xml = make_minimal_fmb_xml()
        fmb_file = tmp_path / "empty_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)

        assert result["form_name"] == "TEST_FORM"
        assert result["blocks"] == []
        assert result["database_tables"] == []
        assert result["summary"]["block_count"] == 0

    def test_summary_counts(self, extract_fmb_deps_mod, tmp_path):
        xml = make_minimal_fmb_xml(
            blocks=[
                {"Name": "BLK1", "DatabaseBlock": "true", "DataSourceName": "T1"},
                {"Name": "BLK2", "DatabaseBlock": "false"},
            ],
            triggers=[
                {"Name": "TRG1", "TriggerType": "form", "TriggerText": "null;"},
            ],
        )
        fmb_file = tmp_path / "test_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)
        s = result["summary"]

        assert s["block_count"] == 2
        assert s["db_block_count"] == 1
        assert s["table_count"] == 1
        assert s["trigger_count"] == 1

    def test_malformed_xml_exits(self, extract_fmb_deps_mod, tmp_path):
        bad_file = tmp_path / "bad.xml"
        bad_file.write_text("<not><valid>xml")

        with pytest.raises(SystemExit) as exc_info:
            extract_fmb_deps_mod.parse_fmb_xml(bad_file)
        assert exc_info.value.code == 2

    def test_json_output_structure(self, extract_fmb_deps_mod, tmp_path):
        """Verify the top-level keys in the output JSON."""
        xml = make_minimal_fmb_xml()
        fmb_file = tmp_path / "test_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)

        expected_keys = {
            "form_name", "form_title", "file_path", "blocks",
            "database_tables", "inherited_blocks", "property_classes",
            "triggers", "program_units", "oracle_packages",
            "procedure_calls", "lov_queries", "screen_navigation",
            "error_codes", "summary",
        }
        assert set(result.keys()) == expected_keys

    def test_namespaced_xml(self, extract_fmb_deps_mod, tmp_path):
        """Verify parsing works when XML has a namespace."""
        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<FormModule xmlns="http://xmlns.oracle.com/Forms" '
            'Name="NS_FORM" Title="Namespaced">\n'
            '  <Block Name="BLK" DatabaseBlock="true" DataSourceName="MY_TABLE" />\n'
            '</FormModule>'
        )
        fmb_file = tmp_path / "ns_fmb.xml"
        fmb_file.write_text(xml)

        result = extract_fmb_deps_mod.parse_fmb_xml(fmb_file)
        assert result["form_name"] == "NS_FORM"
        assert len(result["blocks"]) == 1
        assert "MY_TABLE" in result["database_tables"]


# ---------------------------------------------------------------------------
# CLI / main (via subprocess to test exit codes and stdout JSON)
# ---------------------------------------------------------------------------

class TestCli:
    def test_missing_file_exits_2(self, extract_fmb_deps_mod, tmp_path, monkeypatch):
        monkeypatch.setattr(sys, "argv", ["prog", str(tmp_path / "nonexistent.xml")])
        with pytest.raises(SystemExit) as exc_info:
            extract_fmb_deps_mod.main()
        assert exc_info.value.code == 2
