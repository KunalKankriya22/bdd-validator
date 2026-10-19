---
tags:
  - table
  - LTAPI
---
# API_ONLINE_STATUS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 402
**Last Analyzed**: 2025-10-21 03:00:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | LOOKUP_START | DATE | Yes |  |  |
| 3 | LOOKUP_END | DATE | Yes |  |  |
| 4 | LKUP_OVR_RSN | VARCHAR2(5) | Yes |  |  |
| 5 | LKUP_UPDT_BY | VARCHAR2(10) | Yes |  |  |
| 6 | LKUP_UPDT_TIME | DATE | Yes |  |  |
| 7 | HLTH_HIST_START | DATE | Yes |  |  |
| 8 | HLTH_HIST_END | DATE | Yes |  |  |
| 9 | HLTH_HIST_OVR_RSN | VARCHAR2(5) | Yes |  |  |
| 10 | HLTH_UPDT_BY | VARCHAR2(10) | Yes |  |  |
| 11 | HLTH_UPDT_TIME | DATE | Yes |  |  |
| 12 | PHY_FINDINGS_START | DATE | Yes |  |  |
| 13 | PHY_FINDINGS_END | DATE | Yes |  |  |
| 14 | PHY_OVR_RSN | VARCHAR2(5) | Yes |  |  |
| 15 | PHY_UPDT_BY | VARCHAR2(10) | Yes |  |  |
| 16 | PHY_UPDT_TIME | DATE | Yes |  |  |
| 17 | PHELOB_START | DATE | Yes |  |  |
| 18 | PHELOB_END | DATE | Yes |  |  |
| 19 | PHELOB_UPDT_BY | VARCHAR2(10) | Yes |  |  |
| 20 | PHELOB_UPDT_TIME | DATE | Yes |  |  |
| 21 | DONOR_STOPPED_AT | VARCHAR2(5) | Yes |  |  |
| 22 | STATUS_FLAG | VARCHAR2(1) | Yes |  |  |
| 23 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 24 | PRINT_DATE | DATE | Yes |  |  |
| 25 | UNIT_STATUS | VARCHAR2(1) | Yes |  |  |
| 26 | UNIT_STATUS_UPDT_BY | VARCHAR2(10) | Yes |  |  |
| 27 | UNIT_STATUS_UPDT_ON | DATE | Yes |  |  |
| 28 | COMPETENCY_QUES | VARCHAR2(300) | Yes |  |  |
| 29 | COMPETENCY_ANS | VARCHAR2(10) | Yes |  |  |
| 30 | COMPETENCY_ON | DATE | Yes |  |  |
| 31 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 32 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 33 | DRIVE_DATE | DATE | Yes |  |  |
| 34 | IDP_PROC_CODE | VARCHAR2(5) | Yes |  |  |
| 35 | IDP_PROC_STATUS | VARCHAR2(2) | Yes |  |  |
| 36 | IDP_PROC_STATUS_DATS | DATE | Yes |  |  |
| 37 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 38 | DONOR_ID_VERIFIED | VARCHAR2(1) | Yes |  |  |
| 39 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 40 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 41 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 42 | AUDIT_KEY | NUMBER | Yes |  |  |
| 43 | INSERT_DATE | DATE | Yes |  |  |
| 44 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 45 | UNDER_PROCESSING_FLAG | VARCHAR2(1) | Yes |  |  |
| 46 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 47 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 48 | SURVEY_STATUS | VARCHAR2(1) | Yes |  |  |
| 49 | WEB_RESPONSES_DOWNLOADED | VARCHAR2(1) | Yes |  |  |
| 50 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |
| 51 | WLKOUT_BY | VARCHAR2(10) | Yes |  |  |
| 52 | WLKOUT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_ONLINE_STATUS_IDP_IDX | NORMAL | NONUNIQUE | IDP_PROC_CODE, IDP_PROC_STATUS | VALID |
| API_ONLINE_STATUS_IDX2 | NORMAL | NONUNIQUE | DRIVE_ID, DRIVE_DATE | VALID |
| API_ONLINE_STATUS_IDX_1 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |
| API_ONLINE_STATUS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
