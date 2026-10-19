---
tags:
  - table
  - SBCSYS
---
# RGT_PARM_UNITS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 3 | PARM_ID | VARCHAR2(20) | Yes |  |  |
| 4 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 5 | AUDIT_KEY | NUMBER | Yes |  |  |
| 6 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 7 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
