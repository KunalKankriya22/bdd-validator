---
tags:
  - table
  - DONSYS
---
# MERGED_DONOR_INTERDICTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 581
**Last Analyzed**: 2025-09-16 03:13:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | NEW_DONOR_ID | VARCHAR2(10) | No |  |  |
| 4 | INTER_CODE | VARCHAR2(5) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | INTER_TYPE | VARCHAR2(5) | No |  |  |
| 7 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 8 | NOTIFICATION_STATUS | VARCHAR2(5) | Yes |  |  |
| 9 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 10 | RELEASE_USER | VARCHAR2(6) | Yes |  |  |
| 11 | RELEASE_DATE | DATE | Yes |  |  |
| 12 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 13 | UPM_DISPOSITION | VARCHAR2(1) | Yes |  |  |
| 14 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 15 | ORIGINATED_FROM | VARCHAR2(10) | Yes |  |  |
| 16 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 17 | GROUP_ID | VARCHAR2(15) | Yes |  |  |
| 18 | LETTER_SEQ_NO | VARCHAR2(10) | Yes |  |  |
| 19 | GROUP_MODE | VARCHAR2(5) | Yes |  |  |
| 20 | TERM_DATE | DATE | Yes |  |  |
| 21 | TERM_REASON | VARCHAR2(5) | Yes |  |  |
| 22 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 23 | INSERT_DATE | DATE | No |  |  |
| 24 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MERGED_DONOR_INTER_IDX1 | NORMAL | NONUNIQUE | DONOR_ID, CHAPTER_ID, NEW_DONOR_ID, INTER_CODE, EFF_DATE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/MERGED_DONOR_INTERDICTIONS_BI|MERGED_DONOR_INTERDICTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
