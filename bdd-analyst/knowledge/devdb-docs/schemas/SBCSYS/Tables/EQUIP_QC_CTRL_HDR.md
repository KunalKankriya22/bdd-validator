---
tags:
  - table
  - SBCSYS
---
# EQUIP_QC_CTRL_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 53
**Last Analyzed**: 2025-09-26 03:00:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | QC_ID | VARCHAR2(9) | No |  |  |
| 2 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | QC_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | REVIEW_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | QC_PERIOD | VARCHAR2(1) | Yes |  |  |
| 6 | FREQUENCY | NUMBER(5) | Yes |  |  |
| 7 | REQUIRED_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | EFF_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 11 | LAST_MODIFIED_DATE | DATE | Yes |  |  |

## Primary Key

**EQUIP_QC_CTRL_HDR_PK**: `QC_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/EQUIP_QC_CTRL\|SBCSYS.EQUIP_QC_CTRL]] | HDR_EQUIP_QC_CTRL_FK | QC_ID → QC_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EQUIP_QC_CTRL_HDR_PK | NORMAL | UNIQUE | QC_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
