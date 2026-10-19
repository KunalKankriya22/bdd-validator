---
tags:
  - table
  - SBCSYS
---
# PATHOGEN_STERILE_DOCKING_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1443
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | WELD_MACHINE | VARCHAR2(10) | Yes |  |  |
| 4 | WAFER_LOT_NO | VARCHAR2(10) | Yes |  |  |
| 5 | WELD_OK | VARCHAR2(1) | Yes |  |  |
| 6 | PROC_CODE | VARCHAR2(50) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | SET_LOT_NO | VARCHAR2(10) | Yes |  |  |
| 11 | VOL_TYPE_SET | VARCHAR2(5) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 14 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | SUIT_PROD_CODE | VARCHAR2(8) | Yes |  |  |

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
