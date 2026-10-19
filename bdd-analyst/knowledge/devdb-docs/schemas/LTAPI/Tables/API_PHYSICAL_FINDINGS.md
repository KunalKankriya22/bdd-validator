---
tags:
  - table
  - LTAPI
---
# API_PHYSICAL_FINDINGS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2304
**Last Analyzed**: 2025-10-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | PHYSICAL_CODE | VARCHAR2(5) | Yes |  |  |
| 4 | PHYSICAL_VALUE | VARCHAR2(10) | Yes |  |  |
| 5 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 11 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 12 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 13 | PHYSICAL_VALUE_REPEAT | VARCHAR2(10) | Yes |  |  |
| 14 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 15 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 16 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 17 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 18 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 19 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 20 | EQUIP_REFERENCE_REPEAT | VARCHAR2(9) | Yes |  |  |
| 21 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_PHYSICAL_FINDINGS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
