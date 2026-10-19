---
tags:
  - table
  - DONSYS
---
# DON_INTER_TEMP

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2026-05-15 03:03:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | RUN_ID | VARCHAR2(20) | Yes |  |  |
| 4 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 6 | NOTIFICATION_STATUS | VARCHAR2(5) | Yes |  |  |
| 7 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 8 | RELEASE_USER | VARCHAR2(6) | Yes |  |  |
| 9 | RELEASE_DATE | DATE | Yes |  |  |
| 10 | INTER_TYPE | VARCHAR2(5) | Yes |  |  |
| 11 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 12 | UPM_DISPOSITION | VARCHAR2(1) | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | ORIGINATED_FROM | VARCHAR2(10) | Yes |  |  |
| 15 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 16 | GROUP_ID | VARCHAR2(15) | Yes |  |  |
| 17 | GROUP_MODE | VARCHAR2(5) | Yes |  |  |
| 18 | EFF_DATE | DATE | No |  |  |
| 19 | TERM_DATE | DATE | Yes |  |  |
| 20 | TERM_REASON | VARCHAR2(5) | Yes |  |  |
| 21 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 22 | INSERT_DATE | DATE | No |  |  |
| 23 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 24 | LETTER_SEQ_NO | VARCHAR2(10) | Yes |  |  |

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
