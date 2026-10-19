---
tags:
  - table
  - DONSYS
---
# RESULT_ENTRY_SET

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5
**Last Analyzed**: 2025-09-16 03:14:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SET_ID | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CLOSE_FLAG | VARCHAR2(1) | Yes |  |  |
| 4 | RECONCILE_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | RECONCILE_DATE | DATE | Yes |  |  |
| 6 | RECONCILE_USER | VARCHAR2(6) | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**RESULT_ENTRY_SET_PK**: `SET_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RESULT_ENTRY_SET_PK | NORMAL | UNIQUE | SET_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/RESULT_ENTRY_SET_BI|RESULT_ENTRY_SET_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
