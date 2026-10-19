---
tags:
  - table
  - LTAPI
---
# API_DONOR_CONSENTS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 520
**Last Analyzed**: 2025-10-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | COLL_DATE | DATE | Yes |  |  |
| 5 | LETTER_CODE | VARCHAR2(10) | Yes |  |  |
| 6 | LETTER_ID | VARCHAR2(10) | Yes |  |  |
| 7 | CONSENT_STATUS | VARCHAR2(1) | Yes |  |  |
| 8 | VERSION_NO | NUMBER(2) | Yes |  |  |
| 9 | WITNESS | VARCHAR2(30) | Yes |  |  |
| 10 | SIGNATURE_DATE | DATE | Yes |  |  |
| 11 | MANUAL_SIGNATURE_DATE | DATE | Yes |  |  |
| 12 | DONOR_SIGNATURE | BLOB | Yes |  |  |
| 13 | WITNESS_SIGNATURE | BLOB | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 15 | INSERT_DATE | DATE | Yes |  |  |
| 16 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 17 | AUDIT_KEY | NUMBER | Yes |  |  |
| 18 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 19 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 20 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 21 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 22 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 23 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 24 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_CONSENTS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| DONOR_SIGNATURE | SYS_LOB0000076596C00012$$ | BC_DATA | YES | NO |
| WITNESS_SIGNATURE | SYS_LOB0000076596C00013$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
