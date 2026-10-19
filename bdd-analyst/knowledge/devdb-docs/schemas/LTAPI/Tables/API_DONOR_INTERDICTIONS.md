---
tags:
  - table
  - LTAPI
---
# API_DONOR_INTERDICTIONS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 357
**Last Analyzed**: 2025-10-21 03:00:26
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 4 | EFF_DATE | DATE | Yes |  |  |
| 5 | INTER_TYPE | VARCHAR2(5) | Yes |  |  |
| 6 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 7 | NOTIFICATION_STATUS | VARCHAR2(5) | Yes |  |  |
| 8 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 9 | RELEASE_USER | VARCHAR2(6) | Yes |  |  |
| 10 | RELEASE_DATE | DATE | Yes |  |  |
| 11 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 12 | UPM_DISPOSITION | VARCHAR2(1) | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | ORIGINATED_FROM | VARCHAR2(10) | Yes |  |  |
| 15 | REASON_CODE | VARCHAR2(6) | Yes |  |  |
| 16 | GROUP_ID | VARCHAR2(15) | Yes |  |  |
| 17 | LETTER_SEQ_NO | VARCHAR2(10) | Yes |  |  |
| 18 | GROUP_MODE | VARCHAR2(5) | Yes |  |  |
| 19 | TERM_DATE | DATE | Yes |  |  |
| 20 | TERM_REASON | VARCHAR2(5) | Yes |  |  |
| 21 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 22 | INSERT_DATE | DATE | Yes |  |  |
| 23 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 24 | AUDIT_KEY | NUMBER | Yes |  |  |
| 25 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 26 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 27 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 28 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 29 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 30 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 31 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_INTERDICTIONS_IDX1 | NORMAL | NONUNIQUE | DONOR_ID, INTER_CODE, CHAPTER_ID | VALID |
| API_DONOR_INTERDICTIONS_IDX2 | NORMAL | NONUNIQUE | EFF_DATE | VALID |
| API_DONOR_INTERDICTIONS_IDX3 | NORMAL | NONUNIQUE | INTER_CODE | VALID |
| API_DONOR_INTERDICTIONS_IDX4 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |
| API_DONOR_INTERDICTIONS_IDX5 | NORMAL | NONUNIQUE | NOTIFICATION_STATUS | VALID |
| API_DONOR_INTERDICTIONS_IDX6 | NORMAL | NONUNIQUE | RELEASE_DATE | VALID |
| API_DONOR_INTERDICTIONS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
