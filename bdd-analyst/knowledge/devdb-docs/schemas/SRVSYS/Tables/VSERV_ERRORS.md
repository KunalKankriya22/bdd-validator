---
tags:
  - table
  - SRVSYS
---
# VSERV_ERRORS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 736
**Last Analyzed**: 2026-04-21 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_NAME | VARCHAR2(4) | No |  |  |
| 2 | ERROR_CODE | VARCHAR2(4) | No |  |  |
| 3 | ERROR_TYPE | VARCHAR2(1) | No |  |  |
| 4 | ERROR | VARCHAR2(70) | No |  |  |
| 5 | AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**VSERV_ERRORS_PK**: `APPL_NAME, ERROR_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_ERRORS_PK | NORMAL | UNIQUE | APPL_NAME, ERROR_CODE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_ERRORS_BD|VSERV_ERRORS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ERRORS_BI|VSERV_ERRORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ERRORS_BU|VSERV_ERRORS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
