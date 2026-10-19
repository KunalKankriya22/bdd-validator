---
tags:
  - table
  - SBCSYS
---
# RGT_TUBES_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7951
**Last Analyzed**: 2025-09-16 03:14:37
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 3 | CBC_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | TUBE_CHECK_IN_DATE | DATE | Yes |  |  |
| 6 | RED1_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | RED2_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | PURPLE1_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | PURPLE2_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 11 | USER_ID | VARCHAR2(6) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 14 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 15 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
