---
tags:
  - table
  - SBCSYS
---
# UNIT_FREEZE_DTLS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:15:45
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 4 | COMPONENT_PREFIX | VARCHAR2(2) | No |  |  |
| 5 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 6 | ENTRY_MODE | VARCHAR2(1) | Yes |  |  |
| 7 | FREEZE_TIME | DATE | Yes |  |  |
| 8 | INSERT_DATS | DATE | Yes |  |  |
| 9 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(8) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| COMP_UNIT_FRZ_DTLS_FK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX | [[schemas/SBCSYS/Tables/COMPONENTS\|SBCSYS.COMPONENTS]] (UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX) | NO ACTION |

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| UNIT_FREEZE_DTLS_UK | UNIT_ID, COLL_DATE, PRODUCT_CODE, COMPONENT_PREFIX, CHAPTER_ID | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_FREEZE_DTLS_IDX_1 | NORMAL | UNIQUE | UNIT_ID, PRODUCT_CODE, COMPONENT_PREFIX, CHAPTER_ID | VALID |
| UNIT_FREEZE_DTLS_UK | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, PRODUCT_CODE, COMPONENT_PREFIX, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
