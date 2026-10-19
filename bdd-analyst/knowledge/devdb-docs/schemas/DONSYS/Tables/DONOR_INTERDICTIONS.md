---
tags:
  - table
  - DONSYS
---
# DONOR_INTERDICTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3491532
**Last Analyzed**: 2025-11-05 04:00:16
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
| 15 | REASON_CODE | VARCHAR2(6) | Yes |  |  |
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
| DONOR_INTERDICTIONS_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| DONOR_INTERDICTIONS_IDX1 | NORMAL | NONUNIQUE | DONOR_ID, INTER_CODE, CHAPTER_ID | VALID |
| DONOR_INTERDICTIONS_IDX2 | NORMAL | NONUNIQUE | EFF_DATE | VALID |
| DONOR_INTERDICTIONS_IDX3 | NORMAL | NONUNIQUE | INTER_CODE | VALID |
| DONOR_INTERDICTIONS_IDX4 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |
| DONOR_INTERDICTIONS_IDX5 | NORMAL | NONUNIQUE | NOTIFICATION_STATUS | VALID |
| DONOR_INTERDICTIONS_IDX6 | NORMAL | NONUNIQUE | RELEASE_DATE | VALID |
| DONOR_INTERDICTIONS_IDX7 | NORMAL | NONUNIQUE | UNIT_ID | VALID |
| DONOR_INTERDICTIONS_NI | NORMAL | NONUNIQUE | NOTE_ID | VALID |
| TERM_RSN_IDX | NORMAL | NONUNIQUE | TERM_REASON | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_INTERDICTIONS_BD|DONOR_INTERDICTIONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_INTERDICTIONS_BI|DONOR_INTERDICTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_INTERDICTIONS_BU|DONOR_INTERDICTIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_INTER_SF_UPD|DONOR_INTER_SF_UPD]] — AFTER EACH ROW INSERT OR UPDATE (ENABLED)
- [[schemas/DONSYS/Triggers/INTER_TRANSACTIONS_BD|INTER_TRANSACTIONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| DON_INFO | FUNCTION | DONSYS |
| GENBDR | PACKAGE | DONSYS |
