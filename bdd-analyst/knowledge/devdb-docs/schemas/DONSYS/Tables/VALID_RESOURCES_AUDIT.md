---
tags:
  - table
  - DONSYS
---
# VALID_RESOURCES_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 303
**Last Analyzed**: 2026-04-12 15:09:32
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | RESOURCE_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | RESOURCE_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | RESOURCE_DESC | VARCHAR2(50) | Yes |  |  |
| 8 | CRITICAL_IND | VARCHAR2(1) | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | SORT_SEQ | NUMBER(2) | Yes |  |  |

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
