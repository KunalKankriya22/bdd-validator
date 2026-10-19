---
tags:
  - table
  - SBCSYS
---
# COMPONENT_LABEL_OVERRIDES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 593
**Last Analyzed**: 2025-09-16 03:14:24
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 5 | COMPONENT_PREFIX | VARCHAR2(2) | No |  |  |
| 6 | OLD_LABEL_DECISION | VARCHAR2(4) | Yes |  |  |
| 7 | NEW_LABEL_DECISION | VARCHAR2(4) | Yes |  |  |
| 8 | OVERRIDE_CODE | VARCHAR2(4) | Yes |  |  |
| 9 | OVERRIDE_DATS | DATE | No |  |  |
| 10 | OVERRIDE_USER_ID | VARCHAR2(6) | No |  |  |
| 11 | OVERRIDE_NOTE_ID | NUMBER(10) | Yes |  |  |

## Primary Key

**COMP_LABEL_OVERRIDES_PK**: `UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX, OVERRIDE_DATS`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| COMP_COMP_LABEL_OVERRIDE_FK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX | [[schemas/SBCSYS/Tables/COMPONENTS\|SBCSYS.COMPONENTS]] (UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMP_LABEL_OVERRIDES_PK | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX, OVERRIDE_DATS | VALID |
| COMP_LABEL_OVER_IDX_1 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
