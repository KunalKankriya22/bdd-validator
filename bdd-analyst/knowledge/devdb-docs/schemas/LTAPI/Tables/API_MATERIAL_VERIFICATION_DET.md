---
tags:
  - table
  - LTAPI
---
# API_MATERIAL_VERIFICATION_DET

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1041
**Last Analyzed**: 2025-10-25 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | VERIFICATION_TYPE | VARCHAR2(5) | No |  |  |
| 3 | CATALOG_NO | VARCHAR2(10) | Yes |  |  |
| 4 | TUBE_TYPE | VARCHAR2(10) | Yes |  |  |
| 5 | ADD_ON_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 11 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 12 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 13 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 14 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 15 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 16 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_MATERIAL_VERIFIC_DET_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
