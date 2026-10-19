---
tags:
  - table
  - SBCSYS
---
# TEST_BAND_HEADER_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3439
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
| 8 | TECH1_USER | VARCHAR2(6) | Yes |  |  |
| 9 | TECH1_DATE | DATE | Yes |  |  |
| 10 | TECH2_USER | VARCHAR2(6) | Yes |  |  |
| 11 | TECH2_DATE | DATE | Yes |  |  |
| 12 | SUPER_USER | VARCHAR2(6) | Yes |  |  |
| 13 | SUPER_DATE | DATE | Yes |  |  |
| 14 | RECON_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | TECH1_INTP | VARCHAR2(5) | Yes |  |  |
| 16 | TECH2_INTP | VARCHAR2(5) | Yes |  |  |
| 17 | SUPER_INTP | VARCHAR2(5) | Yes |  |  |
| 18 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 19 | TEST_TYPE | VARCHAR2(5) | Yes |  |  |
| 20 | CTRL_VAL | VARCHAR2(3) | Yes |  |  |
| 21 | AUDIT_KEY | NUMBER | Yes |  |  |
| 22 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 23 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 24 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
