---
tags:
  - table
  - SBCSYS
---
# EQUIP_QC_SCHEDULE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EQUIP_REFERENCE | VARCHAR2(9) | No |  |  |
| 2 | QC_TYPE | VARCHAR2(5) | No |  |  |
| 3 | QC_FREQUENCY | VARCHAR2(4) | No |  |  |
| 4 | START_DATE | DATE | Yes |  |  |
| 5 | DAY_OF_WEEK | VARCHAR2(4) | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | Yes |  |  |

## Primary Key

**EQUIP_QC_SCHED_PK**: `EQUIP_REFERENCE, QC_TYPE, QC_FREQUENCY`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| EQUIP_EQUIP_QC_SCHED_FK | EQUIP_REFERENCE | [[schemas/SBCSYS/Tables/EQUIPMENT\|SBCSYS.EQUIPMENT]] (EQUIP_REFERENCE) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_QC_SCHED_PK | NORMAL | UNIQUE | EQUIP_REFERENCE, QC_TYPE, QC_FREQUENCY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
