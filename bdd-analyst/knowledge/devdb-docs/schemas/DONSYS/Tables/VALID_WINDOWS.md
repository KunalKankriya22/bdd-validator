---
tags:
  - table
  - DONSYS
---
# VALID_WINDOWS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | WINDOW_NAME | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TITLE | VARCHAR2(50) | No |  |  |
| 4 | APPL_ID | VARCHAR2(4) | No |  |  |
| 5 | PARM_1 | VARCHAR2(30) | Yes |  |  |
| 6 | PARM_2 | VARCHAR2(30) | Yes |  |  |
| 7 | PARM_3 | VARCHAR2(30) | Yes |  |  |
| 8 | PARM_4 | VARCHAR2(30) | Yes |  |  |
| 9 | X_POS | NUMBER(3) | Yes |  |  |
| 10 | Y_POS | NUMBER(3) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_WINDOWS_PK**: `APPL_ID, CHAPTER_ID, WINDOW_NAME, PROGRAM_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_WINDOWS_PK | NORMAL | UNIQUE | APPL_ID, CHAPTER_ID, WINDOW_NAME, PROGRAM_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_WINDOWS_BD|VALID_WINDOWS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_WINDOWS_BI|VALID_WINDOWS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_WINDOWS_BU|VALID_WINDOWS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
