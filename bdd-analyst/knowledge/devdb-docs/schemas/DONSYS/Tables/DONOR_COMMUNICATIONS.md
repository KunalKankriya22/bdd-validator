---
tags:
  - table
  - DONSYS
---
# DONOR_COMMUNICATIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 164505
**Last Analyzed**: 2026-05-16 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | COM_CODE | VARCHAR2(5) | No |  |  |
| 4 | COM_DATE | DATE | No |  |  |
| 5 | COM_TYPE | VARCHAR2(5) | No |  |  |
| 6 | COM_DESC | VARCHAR2(2000) | Yes |  |  |
| 7 | ACTION_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | TARGET_DATE | DATE | Yes |  |  |
| 9 | ACTION_DATE | DATE | Yes |  |  |
| 10 | REQUEST_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | LETTER_ID | VARCHAR2(10) | Yes |  |  |
| 12 | STAFF_NO | VARCHAR2(6) | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 14 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | INSERT_DATE | DATE | No |  |  |
| 16 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_COMMUNICATIONS_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| DONOR_COMMUNICATIONS_IDX1 | NORMAL | NONUNIQUE | DONOR_ID, CHAPTER_ID, COM_CODE | VALID |
| DONOR_COMMUNICATIONS_IDX2 | NORMAL | NONUNIQUE | INSERT_DATE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_COMMUNICATIONS_BD|DONOR_COMMUNICATIONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_COMMUNICATIONS_BI|DONOR_COMMUNICATIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_COMMUNICATIONS_BU|DONOR_COMMUNICATIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
