---
tags:
  - table
  - SBCSYS
---
# EQUIPMENT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 336
**Last Analyzed**: 2025-09-16 03:14:27
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INST_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | EQUIP_ID | VARCHAR2(4) | Yes |  |  |
| 5 | EQUIP_REFERENCE | VARCHAR2(9) | No |  |  |
| 6 | SERIAL_NUMBER | VARCHAR2(12) | Yes |  |  |
| 7 | LOCATION | VARCHAR2(5) | Yes |  |  |
| 8 | STATUS | VARCHAR2(4) | Yes |  |  |
| 9 | IN_SERVICE_DATE | DATE | Yes |  |  |
| 10 | OUT_SERVICE_DATE | DATE | Yes |  |  |
| 11 | MANUFACTURER | VARCHAR2(50) | Yes |  |  |
| 12 | SERVICE_CONTACT | VARCHAR2(50) | Yes |  |  |
| 13 | SERVICE_PHONE | VARCHAR2(20) | Yes |  |  |
| 14 | SERVICE_START_DATE | DATE | Yes |  |  |
| 15 | SERVICE_END_DATE | DATE | Yes |  |  |
| 16 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 17 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 18 | MODIFIED_BY | VARCHAR2(20) | Yes |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 20 | AUDIT_KEY | NUMBER | Yes |  |  |
| 21 | OSOK_FLAG | VARCHAR2(1) | Yes |  |  |
| 22 | RECEIVED_DATE | DATE | Yes |  |  |
| 23 | USAGE_DAYS | NUMBER(22) | Yes |  |  |
| 24 | USAGE_HOURS | NUMBER(22) | Yes |  |  |
| 25 | QUALIFICATION_FLAG | VARCHAR2(1) | Yes |  |  |
| 26 | FIRST_PRODUCTION_DATE | DATE | Yes |  |  |
| 27 | LAST_PRODUCTION_DATE | DATE | Yes |  |  |

## Primary Key

**EQUIPMENT_PK**: `EQUIP_REFERENCE`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/EQUIPMENT_EVENT\|SBCSYS.EQUIPMENT_EVENT]] | EQUIP_EQUIP_EVENT_FK | EQUIP_REFERENCE → EQUIP_REFERENCE |
| [[schemas/SBCSYS/Tables/EQUIPMENT_PARM_VALUES\|SBCSYS.EQUIPMENT_PARM_VALUES]] | EQUIP_EQUIP_PARM_VAL_FK | EQUIP_REFERENCE → EQUIP_REFERENCE |
| [[schemas/SBCSYS/Tables/EQUIPMENT_QUALIFICATION\|SBCSYS.EQUIPMENT_QUALIFICATION]] | EQUIP_EQUIP_QUALIF_FK | EQUIP_REFERENCE → EQUIP_REFERENCE |
| [[schemas/SBCSYS/Tables/EQUIP_QC_SCHEDULE\|SBCSYS.EQUIP_QC_SCHEDULE]] | EQUIP_EQUIP_QC_SCHED_FK | EQUIP_REFERENCE → EQUIP_REFERENCE |

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| EQUIPMENT_ID_UK | CHAPTER_ID, EQUIP_TYPE, EQUIP_ID, SERIAL_NUMBER | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIPMENT_ID_UK | NORMAL | UNIQUE | CHAPTER_ID, EQUIP_TYPE, EQUIP_ID, SERIAL_NUMBER | VALID |
| EQUIPMENT_PK | NORMAL | UNIQUE | EQUIP_REFERENCE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/EQUIPMENT_BEFORE_DELETE|EQUIPMENT_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/EQUIPMENT_INSERT_UPDATE|EQUIPMENT_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
