---
tags:
  - table
  - DONSYS
---
# VALID_SEARCH_CRITERION

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 349
**Last Analyzed**: 2025-09-16 03:14:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CRITERION_NAME | VARCHAR2(25) | No |  |  |
| 2 | V_TABLE_NAME | VARCHAR2(32) | No |  |  |
| 3 | V_COLUMN_NAME | VARCHAR2(32) | No |  |  |
| 4 | DEFAULT_OP | VARCHAR2(10) | No |  |  |
| 5 | ENLISTMENT_TYPE | VARCHAR2(5) | No |  |  |
| 6 | CRITERION_DATATYPE | VARCHAR2(1) | Yes |  |  |
| 7 | LOV_TITLE | VARCHAR2(30) | Yes |  |  |
| 8 | LOV_SQL | VARCHAR2(2000) | Yes |  |  |
| 9 | DESC_HINT_TEXT | VARCHAR2(100) | Yes |  |  |
| 10 | EFF_DATE | DATE | No |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | INSERT_DATE | DATE | No |  |  |
| 14 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_SEARCH_CRITERION_PK**: `ENLISTMENT_TYPE, CRITERION_NAME`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_SEARCH_CRITERION_PK | NORMAL | UNIQUE | ENLISTMENT_TYPE, CRITERION_NAME | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_SEARCH_CRITERION_BD|VALID_SEARCH_CRITERION_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SEARCH_CRITERION_BI|VALID_SEARCH_CRITERION_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SEARCH_CRITERION_BU|VALID_SEARCH_CRITERION_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
