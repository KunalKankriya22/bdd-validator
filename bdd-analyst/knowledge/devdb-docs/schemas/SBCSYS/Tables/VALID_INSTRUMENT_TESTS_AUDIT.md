---
tags:
  - table
  - SBCSYS
---
# VALID_INSTRUMENT_TESTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 709
**Last Analyzed**: 2025-09-16 03:15:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | MACHINE_ID | VARCHAR2(5) | Yes |  |  |
| 3 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 4 | MACHINE_TEST_ID | VARCHAR2(50) | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 11 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_INSTRU_TESTS_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
