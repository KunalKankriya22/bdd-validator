---
tags:
  - table
  - DONSYS
---
# VALID_DIFFS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9
**Last Analyzed**: 2025-09-16 03:14:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DIFF_CODE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DIFF_DESC | VARCHAR2(50) | No |  |  |
| 4 | FORMULA | VARCHAR2(1000) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_DIFFS_PK**: `DIFF_CODE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_DIFFS_PK | NORMAL | UNIQUE | DIFF_CODE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_DIFFS_BD|VALID_DIFFS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_DIFFS_BI|VALID_DIFFS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_DIFFS_BU|VALID_DIFFS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
