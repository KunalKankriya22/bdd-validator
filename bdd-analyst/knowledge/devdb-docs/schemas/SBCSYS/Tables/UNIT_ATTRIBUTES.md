---
tags:
  - table
  - SBCSYS
---
# UNIT_ATTRIBUTES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 19348
**Last Analyzed**: 2025-09-16 03:15:44
**Partitioned**: NO

> [!quote] Created from Entity UNIT ATTRIBUTE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 5 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 6 | SOURCE_TEST_ID | VARCHAR2(10) | Yes |  |  |
| 7 | STATUS_FLAG | VARCHAR2(1) | No |  |  |
| 8 | STOP_LABEL_FLAG | VARCHAR2(1) | No |  |  |
| 9 | INSERT_DATS | DATE | No |  |  |
| 10 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_ATTRIBUTES_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, ATTRIB_GROUP, ATTRIB_CODE | VALID |
| UNIT_ATTRIBUTES_IDX_2 | NORMAL | NONUNIQUE | COLL_DATE | VALID |
| UNIT_ATTRIBUTES_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/UNIT_ATTRIBUTES_BEFORE_DELETE|UNIT_ATTRIBUTES_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/UNIT_ATTRIBUTES_BEFORE_INSERT|UNIT_ATTRIBUTES_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/UNIT_ATTRIBUTES_BEFORE_UPDATE|UNIT_ATTRIBUTES_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
