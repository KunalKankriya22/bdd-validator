---
tags:
  - table
  - SBCSYS
---
# VALID_ERRORS_LAB

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1529
**Last Analyzed**: 2026-04-14 03:00:09
**Partitioned**: NO

> [!quote] Created from Entity VALID ERROR by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ERROR_CODE | VARCHAR2(4) | No |  |  |
| 2 | ERROR_TYPE | VARCHAR2(1) | No |  |  |
| 3 | ERROR | VARCHAR2(70) | No |  |  |
| 4 | AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ERRORS_IDX_1 | NORMAL | UNIQUE | ERROR_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_ERRORS_BD|VALID_ERRORS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_ERRORS_BI|VALID_ERRORS_BI]] — BEFORE EACH ROW INSERT (DISABLED)
- [[schemas/SBCSYS/Triggers/VALID_ERRORS_BU|VALID_ERRORS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
