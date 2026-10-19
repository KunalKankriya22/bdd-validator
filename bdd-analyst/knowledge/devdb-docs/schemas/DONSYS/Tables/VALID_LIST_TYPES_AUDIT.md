---
tags:
  - table
  - DONSYS
---
# VALID_LIST_TYPES_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 279
**Last Analyzed**: 2025-09-16 03:14:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | LIST_TYPE | VARCHAR2(5) | Yes |  |  |
| 6 | LIST_DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 7 | SHELF_LIFE | NUMBER(5) | Yes |  |  |
| 8 | ELIG_CHECK_REQD | VARCHAR2(1) | Yes |  |  |
| 9 | MAX_DONORS | NUMBER(5) | Yes |  |  |
| 10 | DEF_PROC_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | DEF_DON_TYPE | VARCHAR2(5) | Yes |  |  |
| 12 | ENLISTMENT_TYPE | VARCHAR2(5) | Yes |  |  |
| 13 | DEFAULT_PRIORITY | VARCHAR2(1) | Yes |  |  |
| 14 | DONOR_OVERRIDE | VARCHAR2(1) | Yes |  |  |
| 15 | EFF_DATE | DATE | Yes |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
