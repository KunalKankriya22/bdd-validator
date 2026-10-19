---
tags:
  - table
  - DONSYS
---
# VALID_LIST_TYPES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 37
**Last Analyzed**: 2025-09-16 03:14:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LIST_TYPE | VARCHAR2(5) | No |  |  |
| 2 | SHELF_LIFE | NUMBER(5) | No |  |  |
| 3 | ELIG_CHECK_REQD | VARCHAR2(1) | No |  |  |
| 4 | MAX_DONORS | NUMBER(5) | No |  |  |
| 5 | ENLISTMENT_TYPE | VARCHAR2(5) | No |  |  |
| 6 | LIST_DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 7 | DEF_PROC_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | DEF_DON_TYPE | VARCHAR2(5) | Yes |  |  |
| 9 | DEFAULT_PRIORITY | VARCHAR2(1) | Yes |  |  |
| 10 | DONOR_OVERRIDE | VARCHAR2(1) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_LIST_TYPES_PK**: `ENLISTMENT_TYPE, LIST_TYPE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_LIST_TYPES_PK | NORMAL | UNIQUE | ENLISTMENT_TYPE, LIST_TYPE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_LIST_TYPES_BD|VALID_LIST_TYPES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_LIST_TYPES_BI|VALID_LIST_TYPES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_LIST_TYPES_BU|VALID_LIST_TYPES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
