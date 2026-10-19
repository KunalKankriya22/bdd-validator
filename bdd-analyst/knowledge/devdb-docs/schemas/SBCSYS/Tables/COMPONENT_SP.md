---
tags:
  - table
  - SBCSYS
---
# COMPONENT_SP

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 755
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
| 11 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 12 | PATIENT_ID | VARCHAR2(11) | Yes |  |  |
| 13 | LINK_UNIT_ID | VARCHAR2(15) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| COMP_COMPONENT_SP_FK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX | [[schemas/SBCSYS/Tables/COMPONENTS\|SBCSYS.COMPONENTS]] (UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX) | NO ACTION |

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| COMPONENT_SP_UK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX, PROCESS_CODE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_SP_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, COMPONENT_PREFIX, PROCESS_CODE | VALID |
| COMPONENT_SP_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/COMPONENT_SP_BEFORE_DELETE|COMPONENT_SP_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/COMPONENT_SP_BEFORE_INSERT|COMPONENT_SP_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/COMPONENT_SP_BEFORE_UPDATE|COMPONENT_SP_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
