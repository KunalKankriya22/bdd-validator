---
tags:
  - table
  - SBCSYS
---
# EQUIP_QC_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 263
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | QC_REFERENCE | VARCHAR2(9) | No |  |  |
| 2 | QC_ID | VARCHAR2(9) | No |  |  |
| 3 | ARRANGE_BY | NUMBER(4) | Yes |  |  |
| 4 | REF_NUMBER | NUMBER(4) | No |  |  |
| 5 | TARGET_VALUE | VARCHAR2(6) | Yes |  |  |
| 6 | MINIMUM_VALUE | VARCHAR2(6) | Yes |  |  |
| 7 | MAXIMUM_VALUE | VARCHAR2(6) | Yes |  |  |
| 8 | OBSERVED_VALUE | VARCHAR2(6) | Yes |  |  |
| 9 | INTERPRETATION | VARCHAR2(1) | Yes |  |  |
| 10 | INSERTED_BY | VARCHAR2(6) | Yes |  |  |
| 11 | INSERT_DATE | DATE | Yes |  |  |
| 12 | INTERPRETATION_2 | VARCHAR2(1) | Yes |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(8) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| HDR_EQUIP_QC_DET_FK | QC_REFERENCE | [[schemas/SBCSYS/Tables/EQUIP_QC_HDR\|SBCSYS.EQUIP_QC_HDR]] (QC_REFERENCE) | NO ACTION |

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| EQUIP_QC_DET_UK | QC_REFERENCE, REF_NUMBER, ARRANGE_BY | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_QC_DET_UK | NORMAL | UNIQUE | QC_REFERENCE, REF_NUMBER, ARRANGE_BY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
