---
tags:
  - table
  - DONSYS
---
# POTENTIAL_DUPLICATES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2167
**Last Analyzed**: 2025-09-16 03:14:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SET_ID | VARCHAR2(14) | No |  |  |
| 2 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | MERGE_FLAG | VARCHAR2(5) | No |  |  |
| 5 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 6 | SET_STATUS_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | RESOLVE_USER | VARCHAR2(6) | Yes |  |  |
| 8 | RESOLVE_DATE | DATE | Yes |  |  |
| 9 | INT_LAST_NAME | VARCHAR2(1) | Yes |  |  |
| 10 | INT_SSN | VARCHAR2(1) | Yes |  |  |
| 11 | INT_DOB | VARCHAR2(1) | Yes |  |  |
| 12 | INT_SEX | VARCHAR2(1) | Yes |  |  |
| 13 | DEMOGRAPHICS_CHECK | VARCHAR2(1) | Yes |  |  |
| 14 | INTERDICTIONS_CHECK | VARCHAR2(1) | Yes |  |  |
| 15 | DONATIONS_CHECK | VARCHAR2(1) | Yes |  |  |
| 16 | ATTRIBUTES_CHECK | VARCHAR2(1) | Yes |  |  |
| 17 | KEYDATA_CHECK | VARCHAR2(1) | Yes |  |  |
| 18 | DEMOGRAPHICS_USER | VARCHAR2(6) | Yes |  |  |
| 19 | INTERDICTIONS_USER | VARCHAR2(6) | Yes |  |  |
| 20 | DONATIONS_USER | VARCHAR2(6) | Yes |  |  |
| 21 | ATTRIBUTES_USER | VARCHAR2(6) | Yes |  |  |
| 22 | KEYDATA_USER | VARCHAR2(6) | Yes |  |  |
| 23 | DEMOGRAPHICS_DATE | DATE | Yes |  |  |
| 24 | INTERDICTIONS_DATE | DATE | Yes |  |  |
| 25 | DONATIONS_DATE | DATE | Yes |  |  |
| 26 | ATTRIBUTES_DATE | DATE | Yes |  |  |
| 27 | KEYDATA_DATE | DATE | Yes |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | INSERT_DATE | DATE | No |  |  |
| 30 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 31 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

**POTENTIAL_DUPLICATES_PK**: `SET_ID, DONOR_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| POTENTIAL_DUPLICATES_PK | NORMAL | UNIQUE | SET_ID, DONOR_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/POTENTIAL_DUPLICATES_BI|POTENTIAL_DUPLICATES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
