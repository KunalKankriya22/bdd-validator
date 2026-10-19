---
tags:
  - table
  - SBCSYS
---
# PATHOGEN_STERILE_DOCKING

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1633
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | WELD_MACHINE | VARCHAR2(10) | Yes |  |  |
| 4 | WAFER_LOT_NO | VARCHAR2(10) | Yes |  |  |
| 5 | WELD_OK | VARCHAR2(1) | Yes |  |  |
| 6 | PROC_CODE | VARCHAR2(50) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | SET_LOT_NO | VARCHAR2(10) | Yes |  |  |
| 11 | VOL_TYPE_SET | VARCHAR2(5) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |
| 13 | SUIT_PROD_CODE | VARCHAR2(8) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/PATHOGEN_STERILE_DOCKING_BD|PATHOGEN_STERILE_DOCKING_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/PATHOGEN_STERILE_DOCKING_BI|PATHOGEN_STERILE_DOCKING_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/PATHOGEN_STERILE_DOCKING_BU|PATHOGEN_STERILE_DOCKING_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
