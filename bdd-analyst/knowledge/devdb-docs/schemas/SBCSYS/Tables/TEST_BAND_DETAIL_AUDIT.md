---
tags:
  - table
  - SBCSYS
---
# TEST_BAND_DETAIL_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4952
**Last Analyzed**: 2025-09-16 03:14:41
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | TB_SEQ_NO | NUMBER(4) | Yes |  |  |
| 7 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 8 | BAND_NAME | VARCHAR2(6) | Yes |  |  |
| 9 | TECH1_BAND_VAL | VARCHAR2(3) | Yes |  |  |
| 10 | TECH2_BAND_VAL | VARCHAR2(3) | Yes |  |  |
| 11 | SUPER_BAND_VAL | VARCHAR2(3) | Yes |  |  |
| 12 | BAND_SEQ | NUMBER(2) | Yes |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 15 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 16 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
