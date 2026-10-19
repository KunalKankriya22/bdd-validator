---
tags:
  - table
  - DONSYS
---
# INTER_TRANSACTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7148982
**Last Analyzed**: 2025-09-16 03:13:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | INTER_CODE | VARCHAR2(5) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | INTER_TYPE | VARCHAR2(5) | No |  |  |
| 6 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 7 | NOTIFICATION_STATUS | VARCHAR2(5) | Yes |  |  |
| 8 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 9 | RELEASE_USER | VARCHAR2(6) | Yes |  |  |
| 10 | RELEASE_DATE | DATE | Yes |  |  |
| 11 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 12 | UPM_DISPOSITION | VARCHAR2(1) | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | ORIGINATED_FROM | VARCHAR2(10) | Yes |  |  |
| 15 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 16 | GROUP_ID | VARCHAR2(15) | Yes |  |  |
| 17 | LETTER_SEQ_NO | VARCHAR2(10) | Yes |  |  |
| 18 | GROUP_MODE | VARCHAR2(5) | Yes |  |  |
| 19 | TERM_DATE | DATE | Yes |  |  |
| 20 | TERM_REASON | VARCHAR2(5) | Yes |  |  |
| 21 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 22 | INSERT_DATE | DATE | No |  |  |
| 23 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 24 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| INTER_TRANSACTIONS_IDX1 | NORMAL | NONUNIQUE | DONOR_ID, CHAPTER_ID, INTER_CODE | VALID |
| INTER_TRANSACTIONS_IDX2 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/INTER_TRANSACTIONS_BI|INTER_TRANSACTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/INTER_TRANSACTIONS_BU|INTER_TRANSACTIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
