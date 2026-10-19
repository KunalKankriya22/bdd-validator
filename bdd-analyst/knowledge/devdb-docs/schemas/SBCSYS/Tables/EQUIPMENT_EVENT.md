---
tags:
  - table
  - SBCSYS
---
# EQUIPMENT_EVENT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 39
**Last Analyzed**: 2025-09-26 03:00:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EVENT_REFERENCE | VARCHAR2(9) | No |  |  |
| 2 | EQUIP_REFERENCE | VARCHAR2(9) | No |  |  |
| 3 | DOWNTIME_CODE | VARCHAR2(5) | Yes |  |  |
| 4 | DOWNTIME_FLAG | VARCHAR2(4) | Yes |  |  |
| 5 | DOWNTIME_START | DATE | Yes |  |  |
| 6 | DOWNTIME_END | DATE | Yes |  |  |
| 7 | SERVICE_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | SERVICE_START | DATE | Yes |  |  |
| 9 | SERVICE_END | DATE | Yes |  |  |
| 10 | SERVICE_PERSON | VARCHAR2(30) | Yes |  |  |
| 11 | QC_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 15 | SERVICE_COMPANY | VARCHAR2(50) | Yes |  |  |

## Primary Key

**EQUIP_EVENT_PK**: `EVENT_REFERENCE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| EQUIP_EQUIP_EVENT_FK | EQUIP_REFERENCE | [[schemas/SBCSYS/Tables/EQUIPMENT\|SBCSYS.EQUIPMENT]] (EQUIP_REFERENCE) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_EVENT_PK | NORMAL | UNIQUE | EVENT_REFERENCE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
