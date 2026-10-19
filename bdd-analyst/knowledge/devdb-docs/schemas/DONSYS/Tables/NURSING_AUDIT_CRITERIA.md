---
tags:
  - table
  - DONSYS
---
# NURSING_AUDIT_CRITERIA

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9
**Last Analyzed**: 2025-09-16 03:13:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_PREFERENCE | VARCHAR2(5) | No |  |  |
| 2 | FROM_DATE | DATE | Yes |  |  |
| 3 | TO_DATE | DATE | Yes |  |  |
| 4 | PREFERENCE_VALUE | VARCHAR2(15) | Yes |  |  |
| 5 | PREFERENCE_STATUS | VARCHAR2(1) | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
