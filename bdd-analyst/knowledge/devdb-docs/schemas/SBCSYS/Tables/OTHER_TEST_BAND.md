---
tags:
  - table
  - SBCSYS
---
# OTHER_TEST_BAND

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9
**Last Analyzed**: 2025-09-16 03:14:32
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | TB_ID | VARCHAR2(14) | No |  |  |
| 6 | TEST_ID | VARCHAR2(10) | No |  |  |
| 7 | TB_SEQ_NO | NUMBER(4) | No |  |  |
| 8 | BAND1 | VARCHAR2(6) | Yes |  |  |
| 9 | BAND2 | VARCHAR2(6) | Yes |  |  |
| 10 | TECH | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
