---
tags:
  - table
  - SRVSYS
---
# VSERV_ERRORS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2528
**Last Analyzed**: 2026-04-21 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ERROR_CODE | VARCHAR2(4) | Yes |  |  |
| 2 | ERROR_TYPE | VARCHAR2(1) | Yes |  |  |
| 3 | ERROR | VARCHAR2(70) | Yes |  |  |
| 4 | APPL_NAME | VARCHAR2(4) | Yes |  |  |
| 5 | AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_ERRORS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
