---
tags:
  - table
  - LTAPI
---
# API_DONOR_PICTURES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 284
**Last Analyzed**: 2025-10-25 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | DONOR_PIC | BLOB | Yes |  |  |
| 3 | INSERT_DATE | DATE | Yes |  |  |
| 4 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 5 | AUDIT_KEY | NUMBER | Yes |  |  |
| 6 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 7 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 8 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 9 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 10 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 11 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 12 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_PICTURES_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| DONOR_PIC | SYS_LOB0000076601C00002$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
