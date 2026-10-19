---
tags:
  - table
  - DONSYS
---
# VALID_DAY_STATUS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 68
**Last Analyzed**: 2026-05-07 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | STATUS | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | RESOURCE_CODE | VARCHAR2(5) | No |  |  |
| 4 | LOWER_LIMIT | NUMBER(5,2) | Yes |  |  |
| 5 | UPPER_LIMIT | NUMBER(5,2) | Yes |  |  |
| 6 | COLOR_CODE | VARCHAR2(10) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_DAY_STATUS_PK**: `STATUS, CHAPTER_ID, RESOURCE_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_DAY_STATUS_PK | NORMAL | UNIQUE | STATUS, CHAPTER_ID, RESOURCE_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_DAY_STATUS_BD|VALID_DAY_STATUS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_DAY_STATUS_BI|VALID_DAY_STATUS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_DAY_STATUS_BU|VALID_DAY_STATUS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
