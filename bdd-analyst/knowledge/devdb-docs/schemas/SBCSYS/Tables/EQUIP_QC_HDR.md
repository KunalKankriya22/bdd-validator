---
tags:
  - table
  - SBCSYS
---
# EQUIP_QC_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 319
**Last Analyzed**: 2025-09-26 03:00:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EQUIP_REFERENCE | VARCHAR2(9) | No |  |  |
| 2 | QC_REFERENCE | VARCHAR2(9) | No |  |  |
| 3 | QC_TYPE | VARCHAR2(5) | No |  |  |
| 4 | QC_ID | VARCHAR2(9) | No |  |  |
| 5 | QC_DATE | DATE | No |  |  |
| 6 | QC_TECH_1 | VARCHAR2(6) | Yes |  |  |
| 7 | QC_TECH_2 | VARCHAR2(6) | Yes |  |  |
| 8 | QC_RESULT_1 | VARCHAR2(5) | Yes |  |  |
| 9 | QC_RESULT_2 | VARCHAR2(5) | Yes |  |  |
| 10 | QC_STATUS | VARCHAR2(5) | Yes |  |  |
| 11 | INSERT_DATE | DATE | Yes |  |  |
| 12 | EVENT_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 15 | AUDIT_KEY | NUMBER | Yes |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 17 | NOTE_ID | NUMBER(10) | Yes |  |  |

## Primary Key

**EQUIP_QC_HDR_PK**: `QC_REFERENCE`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/EQUIP_QC_DET\|SBCSYS.EQUIP_QC_DET]] | HDR_EQUIP_QC_DET_FK | QC_REFERENCE → QC_REFERENCE |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_QC_HDR_PK | NORMAL | UNIQUE | QC_REFERENCE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
