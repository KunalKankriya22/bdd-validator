---
tags:
  - table
  - SBCSYS
---
# COMPONENT_SP_REAG_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 422
**Last Analyzed**: 2025-09-16 03:14:25
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
| 8 | INSERT_DATS | DATE | No |  |  |
| 9 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 10 | KIT_ID | NUMBER | No |  |  |

## Primary Key

**COMP_SP_REAG_HDR_PK**: `UNIT_ID, COLL_DATE, CHAPTER_ID, COMPONENT_PREFIX, PRODUCT_CODE, PROCESS_CODE, STAGE_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| COMP_COMP_SP_REAG_HDR_FK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX | [[schemas/SBCSYS/Tables/COMPONENTS\|SBCSYS.COMPONENTS]] (UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_SP_REAG_HDR_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX, PROCESS_CODE, STAGE_CODE | VALID |
| COMPONENT_SP_REAG_HDR_IDX_2 | NORMAL | NONUNIQUE | KIT_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
