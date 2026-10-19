---
tags:
  - table
  - DONSYS
---
# GRADED_DONATIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 470
**Last Analyzed**: 2026-05-19 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 4 | GENDER | VARCHAR2(1) | Yes |  |  |
| 5 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 6 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 7 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 8 | SSN | NUMBER(9) | Yes |  |  |
| 9 | ACTIVE_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

**GRADED_DONATIONS_PK**: `TRANSACTION_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| GRADED_DONATIONS_PK | NORMAL | UNIQUE | TRANSACTION_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/GRADED_DONATIONS_BI|GRADED_DONATIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
