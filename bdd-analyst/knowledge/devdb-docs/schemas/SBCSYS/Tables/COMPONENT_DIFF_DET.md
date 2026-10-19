---
tags:
  - table
  - SBCSYS
---
# COMPONENT_DIFF_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 38
**Last Analyzed**: 2025-09-16 03:14:24
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DIFFERENTIAL_ID | NUMBER | No |  |  |
| 2 | CELL_CODE | VARCHAR2(5) | No |  |  |
| 3 | CELL_COUNT | NUMBER(5,2) | No |  |  |

## Primary Key

**COMP_DIIF_DET_PK**: `DIFFERENTIAL_ID, CELL_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| HDR_COMP_DIFF_DET_FK | DIFFERENTIAL_ID | [[schemas/SBCSYS/Tables/COMPONENT_DIFF_HDR\|SBCSYS.COMPONENT_DIFF_HDR]] (DIFFERENTIAL_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_DIFF_DET_IDX_1 | NORMAL | UNIQUE | DIFFERENTIAL_ID, CELL_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
