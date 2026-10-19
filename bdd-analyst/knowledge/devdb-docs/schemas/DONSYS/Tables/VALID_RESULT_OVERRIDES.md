---
tags:
  - table
  - DONSYS
---
# VALID_RESULT_OVERRIDES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 257
**Last Analyzed**: 2026-04-24 03:00:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CURRENT_RESULT_STATUS | VARCHAR2(5) | No |  |  |
| 4 | NEW_RESULT_STATUS | VARCHAR2(5) | No |  |  |
| 5 | OVERRIDE_FLAG | VARCHAR2(1) | No |  |  |
| 6 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_RESULT_OVERRIDES_PK**: `TEST_ID, CHAPTER_ID, CURRENT_RESULT_STATUS, NEW_RESULT_STATUS, EFF_DATE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_RESULT_OVERRIDES_IDX1 | NORMAL | NONUNIQUE | TEST_ID, CHAPTER_ID | VALID |
| VALID_RESULT_OVERRIDES_PK | NORMAL | UNIQUE | TEST_ID, CHAPTER_ID, CURRENT_RESULT_STATUS, NEW_RESULT_STATUS, EFF_DATE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_RESULT_OVERRIDES_BD|VALID_RESULT_OVERRIDES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_RESULT_OVERRIDES_BI|VALID_RESULT_OVERRIDES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_RESULT_OVERRIDES_BU|VALID_RESULT_OVERRIDES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
