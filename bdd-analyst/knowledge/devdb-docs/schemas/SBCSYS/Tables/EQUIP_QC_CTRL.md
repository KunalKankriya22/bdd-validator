---
tags:
  - table
  - SBCSYS
---
# EQUIP_QC_CTRL

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 32
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | QC_ID | VARCHAR2(9) | No |  |  |
| 2 | REF_NUMBER | NUMBER(4) | No |  |  |
| 3 | ARRANGE_BY | NUMBER(4) | Yes |  |  |
| 4 | QC_ITEM | VARCHAR2(50) | No |  |  |
| 5 | QC_UNITS | VARCHAR2(24) | Yes |  |  |
| 6 | TARGET_VALUE | VARCHAR2(12) | Yes |  |  |
| 7 | MIN_ACCEPT | VARCHAR2(12) | Yes |  |  |
| 8 | MAX_ACCEPT | VARCHAR2(12) | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 12 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |

## Primary Key

**EQUIP_QC_CTRL_PK**: `QC_ID, REF_NUMBER`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| HDR_EQUIP_QC_CTRL_FK | QC_ID | [[schemas/SBCSYS/Tables/EQUIP_QC_CTRL_HDR\|SBCSYS.EQUIP_QC_CTRL_HDR]] (QC_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_QC_CTRL_PK | NORMAL | UNIQUE | QC_ID, REF_NUMBER | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
