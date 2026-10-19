---
tags:
  - table
  - SBCSYS
---
# REMOTE_TEST_UNITS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLLECTION_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | BATCH_ID | VARCHAR2(15) | No |  |  |
| 5 | EXTRACT_DATE | DATE | No |  |  |
| 6 | FIRST_RESULT_DATE | DATE | Yes |  |  |
| 7 | LAST_RESULT_DATE | DATE | Yes |  |  |
| 8 | UNIT_STATUS | VARCHAR2(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| BATCH_REMOTE_TEST_UNITS_FK | BATCH_ID | [[schemas/SBCSYS/Tables/REMOTE_TEST_BATCH\|SBCSYS.REMOTE_TEST_BATCH]] (BATCH_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| REMOTE_TEST_IDX_2 | NORMAL | NONUNIQUE | BATCH_ID, UNIT_ID | VALID |
| REMOTE_TEST_UNITS_IDX_1 | NORMAL | NONUNIQUE | UNIT_ID, COLLECTION_DATE | VALID |
| REMOTE_TEST_UNITS_IDX_2 | NORMAL | NONUNIQUE | UNIT_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
