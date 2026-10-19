---
tags:
  - table
  - SBCSYS
---
# COMPONENT_SPIKING

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 660
**Last Analyzed**: 2026-05-22 03:00:15
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
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATS | DATE | No |  |  |
| 10 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 11 | SPIKING_TYPE | VARCHAR2(5) | No |  |  |
| 12 | BAG_LOT_NUMBER | VARCHAR2(30) | No |  |  |
| 13 | BAGS_SPIKED | NUMBER(3) | No |  |  |
| 14 | BAGS_FOR_COMPONENTS | NUMBER(3) | No |  |  |
| 15 | BAGS_USED | NUMBER(3) | No |  |  |
| 16 | FILTER_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 17 | BAG_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

**COMPONENT_SPIKING_PK**: `UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX, PROCESS_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| COMP_COMP_SPIKING_FK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX | [[schemas/SBCSYS/Tables/COMPONENTS\|SBCSYS.COMPONENTS]] (UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_SPIKING_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX, PROCESS_CODE | VALID |
| COMPONENT_SPIKING_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/COMP_SPIKE_BEFORE_DELETE|COMP_SPIKE_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/COMP_SPIKE_BEFORE_INSERT|COMP_SPIKE_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/COMP_SPIKE_BEFORE_UPDATE|COMP_SPIKE_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
