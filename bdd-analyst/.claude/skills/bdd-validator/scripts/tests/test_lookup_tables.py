"""Tests for lookup-tables.py -- database table definition lookup."""

import json
import sys

import pytest

from tests.helpers import write_table_md


# ---------------------------------------------------------------------------
# Table markdown content fixtures
# ---------------------------------------------------------------------------

SAMPLE_TABLE_MD = """\
# DONORS

**Schema**: [[BM|BM]]
**Tablespace**: BM_DATA
**Estimated Rows**: 50000
**Last Analyzed**: 2024-01-15
**Partitioned**: NO

## Columns

| # | Name | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | NUMBER(10) | NO |  | Primary key |
| 2 | FIRST_NAME | VARCHAR2(50) | NO |  | First name |
| 3 | LAST_NAME | VARCHAR2(50) | NO |  | Last name |
| 4 | BIRTH_DATE | DATE | YES |  | Date of birth |
| 5 | STATUS | VARCHAR2(1) | NO | A | Active/Inactive |

## Primary Key

DONOR_ID

## Foreign Keys

- DONORS_FK1: STATUS references DONOR_STATUS(STATUS_CODE)

## Referenced By

- DONATIONS_FK1: DONATIONS(DONOR_ID) references DONORS(DONOR_ID)

## Triggers

- DONORS_BIU: BEFORE INSERT OR UPDATE

## Indexes

| Index Name | Columns | Unique |
| --- | --- | --- |
| DONORS_PK | DONOR_ID | YES |
| DONORS_NAME_IX | LAST_NAME, FIRST_NAME | NO |

## Grants

| Grantee | Privilege |
| --- | --- |
| BM_APP | SELECT, INSERT, UPDATE |
"""

SIMPLE_TABLE_MD = """\
# SIMPLE_TABLE

## Columns

| # | Name | Type | Nullable | Default |
| --- | --- | --- | --- | --- |
| 1 | ID | NUMBER | NO |  |
| 2 | VALUE | VARCHAR2(100) | YES |  |

## Primary Key

> [!note] No primary key defined.
"""

NO_PK_TABLE_MD = """\
# LOG_TABLE

## Columns

| # | Name | Type | Nullable | Default |
| --- | --- | --- | --- | --- |
| 1 | LOG_ID | NUMBER | NO |  |

## Primary Key

> [!warning] no primary key
"""


# ---------------------------------------------------------------------------
# parse_columns
# ---------------------------------------------------------------------------

class TestParseColumns:
    def test_parses_all_columns(self, lookup_tables_mod):
        columns = lookup_tables_mod.parse_columns(SAMPLE_TABLE_MD)
        assert len(columns) == 5

    def test_column_fields(self, lookup_tables_mod):
        columns = lookup_tables_mod.parse_columns(SAMPLE_TABLE_MD)
        first = columns[0]
        assert first["position"] == "1"
        assert first["name"] == "DONOR_ID"
        assert first["type"] == "NUMBER(10)"
        assert first["nullable"] == "NO"
        assert first["comment"] == "Primary key"

    def test_column_with_default(self, lookup_tables_mod):
        columns = lookup_tables_mod.parse_columns(SAMPLE_TABLE_MD)
        status_col = [c for c in columns if c["name"] == "STATUS"][0]
        assert status_col["default"] == "A"

    def test_no_columns_section(self, lookup_tables_mod):
        content = "# EMPTY\n\nNo columns here."
        columns = lookup_tables_mod.parse_columns(content)
        assert columns == []

    def test_columns_with_fewer_fields(self, lookup_tables_mod):
        columns = lookup_tables_mod.parse_columns(SIMPLE_TABLE_MD)
        assert len(columns) == 2
        # comment should be empty string when not present
        assert columns[0]["comment"] == ""


# ---------------------------------------------------------------------------
# parse_primary_key
# ---------------------------------------------------------------------------

class TestParsePrimaryKey:
    def test_finds_primary_key(self, lookup_tables_mod):
        pk = lookup_tables_mod.parse_primary_key(SAMPLE_TABLE_MD)
        assert pk == "DONOR_ID"

    def test_no_primary_key(self, lookup_tables_mod):
        pk = lookup_tables_mod.parse_primary_key(NO_PK_TABLE_MD)
        assert pk is None

    def test_no_pk_note(self, lookup_tables_mod):
        pk = lookup_tables_mod.parse_primary_key(SIMPLE_TABLE_MD)
        assert pk is None

    def test_missing_pk_section(self, lookup_tables_mod):
        content = "# TABLE\n\n## Columns\n\nSome stuff."
        pk = lookup_tables_mod.parse_primary_key(content)
        assert pk is None


# ---------------------------------------------------------------------------
# parse_table_section
# ---------------------------------------------------------------------------

class TestParseTableSection:
    def test_foreign_keys(self, lookup_tables_mod):
        fks = lookup_tables_mod.parse_table_section(SAMPLE_TABLE_MD, "Foreign Keys")
        assert len(fks) == 1
        assert "STATUS" in fks[0]

    def test_referenced_by(self, lookup_tables_mod):
        refs = lookup_tables_mod.parse_table_section(SAMPLE_TABLE_MD, "Referenced By")
        assert len(refs) == 1
        assert "DONATIONS" in refs[0]

    def test_triggers(self, lookup_tables_mod):
        triggers = lookup_tables_mod.parse_table_section(SAMPLE_TABLE_MD, "Triggers")
        assert len(triggers) == 1
        assert "DONORS_BIU" in triggers[0]

    def test_indexes_from_table(self, lookup_tables_mod):
        indexes = lookup_tables_mod.parse_table_section(SAMPLE_TABLE_MD, "Indexes")
        assert len(indexes) == 2

    def test_missing_section(self, lookup_tables_mod):
        result = lookup_tables_mod.parse_table_section(SAMPLE_TABLE_MD, "Nonexistent Section")
        assert result == []


# ---------------------------------------------------------------------------
# parse_metadata
# ---------------------------------------------------------------------------

class TestParseMetadata:
    def test_all_metadata_fields(self, lookup_tables_mod):
        meta = lookup_tables_mod.parse_metadata(SAMPLE_TABLE_MD)
        assert meta["schema"] == "BM"
        assert meta["tablespace"] == "BM_DATA"
        assert meta["estimated_rows"] == "50000"
        assert meta["partitioned"] == "NO"

    def test_empty_content(self, lookup_tables_mod):
        meta = lookup_tables_mod.parse_metadata("")
        assert meta == {}


# ---------------------------------------------------------------------------
# parse_table_file
# ---------------------------------------------------------------------------

class TestParseTableFile:
    def test_full_parse(self, lookup_tables_mod, tmp_path):
        table_file = tmp_path / "DONORS.md"
        table_file.write_text(SAMPLE_TABLE_MD)

        result = lookup_tables_mod.parse_table_file(table_file)

        assert result["table_name"] == "DONORS"
        assert result["file_path"] == str(table_file)
        assert len(result["columns"]) == 5
        assert result["primary_key"] == "DONOR_ID"
        assert len(result["foreign_keys"]) == 1
        assert len(result["referenced_by"]) == 1
        assert len(result["triggers"]) == 1
        assert len(result["indexes"]) == 2


# ---------------------------------------------------------------------------
# build_table_index
# ---------------------------------------------------------------------------

class TestBuildTableIndex:
    def test_indexes_tables_across_schemas(self, lookup_tables_mod, tmp_project):
        write_table_md(tmp_project, "BM", "DONORS", "# DONORS")
        write_table_md(tmp_project, "BM", "DONATIONS", "# DONATIONS")
        write_table_md(tmp_project, "COMMON", "CODES", "# CODES")

        devdb_path = tmp_project / "knowledge" / "devdb-docs"
        index = lookup_tables_mod.build_table_index(devdb_path)

        assert "DONORS" in index
        assert "DONATIONS" in index
        assert "CODES" in index

    def test_empty_schemas(self, lookup_tables_mod, tmp_project):
        devdb_path = tmp_project / "knowledge" / "devdb-docs"
        index = lookup_tables_mod.build_table_index(devdb_path)
        assert index == {}

    def test_missing_devdb_path(self, lookup_tables_mod, tmp_path):
        index = lookup_tables_mod.build_table_index(tmp_path / "nonexistent")
        assert index == {}


# ---------------------------------------------------------------------------
# CLI / main
# ---------------------------------------------------------------------------

class TestLookupTablesCli:
    def _run_main(self, mod, project_root, tables, monkeypatch):
        import io
        argv = ["prog", str(project_root)] + tables
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

    def test_found_table(self, lookup_tables_mod, tmp_project, monkeypatch):
        write_table_md(tmp_project, "BM", "DONORS", SAMPLE_TABLE_MD)

        result, exit_code = self._run_main(
            lookup_tables_mod, tmp_project, ["DONORS"], monkeypatch,
        )

        assert exit_code == 0
        assert "DONORS" in result["found"]
        assert result["not_found"] == []
        assert result["summary"]["found"] == 1

    def test_not_found_table(self, lookup_tables_mod, tmp_project, monkeypatch):
        result, exit_code = self._run_main(
            lookup_tables_mod, tmp_project, ["NONEXISTENT"], monkeypatch,
        )

        assert exit_code == 1
        assert "NONEXISTENT" in result["not_found"]
        assert result["summary"]["not_found"] == 1

    def test_mixed_found_and_not_found(self, lookup_tables_mod, tmp_project, monkeypatch):
        write_table_md(tmp_project, "BM", "DONORS", SAMPLE_TABLE_MD)

        result, exit_code = self._run_main(
            lookup_tables_mod, tmp_project, ["DONORS", "MISSING_TABLE"], monkeypatch,
        )

        assert exit_code == 1
        assert "DONORS" in result["found"]
        assert "MISSING_TABLE" in result["not_found"]
        assert result["summary"]["requested"] == 2

    def test_case_insensitive_lookup(self, lookup_tables_mod, tmp_project, monkeypatch):
        write_table_md(tmp_project, "BM", "DONORS", SAMPLE_TABLE_MD)

        result, _code = self._run_main(
            lookup_tables_mod, tmp_project, ["donors"], monkeypatch,
        )

        assert "donors" in result["found"]

    def test_missing_devdb_exits_2(self, lookup_tables_mod, tmp_path, monkeypatch):
        monkeypatch.setattr(sys, "argv", ["prog", str(tmp_path), "ANY_TABLE"])
        with pytest.raises(SystemExit) as exc_info:
            lookup_tables_mod.main()
        assert exc_info.value.code == 2

    def test_json_output_structure(self, lookup_tables_mod, tmp_project, monkeypatch):
        write_table_md(tmp_project, "BM", "T1", SIMPLE_TABLE_MD)

        result, _ = self._run_main(
            lookup_tables_mod, tmp_project, ["T1"], monkeypatch,
        )

        assert "found" in result
        assert "not_found" in result
        assert "summary" in result
        assert "requested" in result["summary"]
        assert "found" in result["summary"]
        assert "not_found" in result["summary"]
