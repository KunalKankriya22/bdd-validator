---
tags:
  - table
  - SBCSYS
---
# COMPONENT_DIFF_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 20
**Last Analyzed**: 2025-09-16 03:14:24
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | COMPONENT_PREFIX | VARCHAR2(2) | No |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 6 | PROCESS_CODE | VARCHAR2(5) | No |  |  |
| 7 | STAGE_CODE | VARCHAR2(5) | No |  |  |
| 8 | EXT_INT_FLAG | VARCHAR2(1) | No |  |  |
| 9 | INSERT_DATS | DATE | No |  |  |
| 10 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 11 | DIFFERENTIAL_ID | NUMBER | No |  |  |
| 12 | NOTE_ID | NUMBER(10) | Yes |  |  |

## Primary Key

**COMP_DIFF_HDR_PK**: `DIFFERENTIAL_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| COMP_COMP_DIFF_HDR_FK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX | [[schemas/SBCSYS/Tables/COMPONENTS\|SBCSYS.COMPONENTS]] (UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX) | NO ACTION |

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/COMPONENT_DIFF_DET\|SBCSYS.COMPONENT_DIFF_DET]] | HDR_COMP_DIFF_DET_FK | DIFFERENTIAL_ID → DIFFERENTIAL_ID |

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| COMP_DIFF_HDR_UK | UNIT_ID, COLL_DATE, CHAPTER_ID, COMPONENT_PREFIX, PRODUCT_CODE, PROCESS_CODE, STAGE_CODE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_DIFF_HDR_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX, PROCESS_CODE, STAGE_CODE | VALID |
| COMPONENT_DIFF_HDR_IDX_2 | NORMAL | UNIQUE | DIFFERENTIAL_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
