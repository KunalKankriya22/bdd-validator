---
tags:
  - table
  - SBCSYS
---
# UNIT_INTERDICTIONS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 23501
**Last Analyzed**: 2025-09-16 03:15:45
**Partitioned**: NO

> [!quote] Created from Entity UNIT INTERDICTION by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | INTER_CODE | VARCHAR2(4) | No |  |  |
| 5 | INSERT_DATS | DATE | No |  |  |
| 6 | INTER_USER_ID | VARCHAR2(6) | No |  |  |
| 7 | SOURCE_TEST_ID | VARCHAR2(10) | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_INTERDICTIONS_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, INTER_CODE | VALID |
| UNIT_INTERDICTIONS_IDX_2 | NORMAL | NONUNIQUE | COLL_DATE, INTER_CODE | VALID |
| UNIT_INTERDICTIONS_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/UNIT_INTER_BEFORE_DELETE|UNIT_INTER_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/UNIT_INTER_BEFORE_INSERT|UNIT_INTER_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/UNIT_INTER_UPDATE|UNIT_INTER_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
