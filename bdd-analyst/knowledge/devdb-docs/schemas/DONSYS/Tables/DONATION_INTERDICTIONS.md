---
tags:
  - table
  - DONSYS
---
# DONATION_INTERDICTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 26062
**Last Analyzed**: 2026-05-07 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | INTER_CODE | VARCHAR2(5) | No |  |  |
| 4 | INTER_TYPE | VARCHAR2(5) | No |  |  |
| 5 | SOURCE_CODE | VARCHAR2(10) | Yes |  |  |
| 6 | RELEASE_USER | VARCHAR2(6) | Yes |  |  |
| 7 | RELEASE_DATE | DATE | Yes |  |  |
| 8 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 9 | TERM_REASON | VARCHAR2(5) | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | GROUP_ID | VARCHAR2(15) | Yes |  |  |
| 12 | ORIGINATED_FROM | VARCHAR2(10) | Yes |  |  |
| 13 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 14 | GROUP_MODE | VARCHAR2(5) | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 17 | INSERT_DATE | DATE | No |  |  |
| 18 | COLL_DATE | DATE | Yes |  |  |
| 19 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 20 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONATION_INTERDICTIONS_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| DONATION_INTERDICTIONS_IDX1 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |
| DONATION_INTERDICTIONS_IDX2 | NORMAL | NONUNIQUE | UNIT_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONATION_INTERDICTIONS_BD|DONATION_INTERDICTIONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONATION_INTERDICTIONS_BI|DONATION_INTERDICTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONATION_INTERDICTIONS_BU|DONATION_INTERDICTIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| GENBDR | PACKAGE | DONSYS |
