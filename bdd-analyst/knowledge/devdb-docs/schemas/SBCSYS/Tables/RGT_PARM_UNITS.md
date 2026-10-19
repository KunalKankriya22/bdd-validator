---
tags:
  - table
  - SBCSYS
---
# RGT_PARM_UNITS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 96
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | PARM_ID | VARCHAR2(20) | Yes |  |  |
| 4 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 5 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_PARM_UNITS_BD|RGT_PARM_UNITS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_PARM_UNITS_BI|RGT_PARM_UNITS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_PARM_UNITS_BU|RGT_PARM_UNITS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
