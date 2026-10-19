---
tags:
  - table
  - DONSYS
---
# ONLINE_STATUS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 18210
**Last Analyzed**: 2025-11-15 04:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
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
| 37 | DONOR_ID_VERIFIED | VARCHAR2(1) | Yes |  |  |
| 38 | AUDIT_KEY | NUMBER | Yes |  |  |
| 39 | INSERT_DATE | DATE | Yes |  |  |
| 40 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 41 | UNDER_PROCESSING_FLAG | VARCHAR2(1) | Yes |  |  |
| 42 | SURVEY_STATUS | VARCHAR2(1) | Yes |  |  |
| 43 | WEB_RESPONSES_DOWNLOADED | VARCHAR2(1) | Yes |  |  |
| 44 | WLKOUT_BY | VARCHAR2(10) | Yes |  |  |
| 45 | WLKOUT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ONLINE_STATUS_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| ONLINE_STATUS_IDP_IDX | NORMAL | NONUNIQUE | IDP_PROC_CODE, IDP_PROC_STATUS | VALID |
| ONLINE_STATUS_IDX2 | NORMAL | NONUNIQUE | DRIVE_ID, DRIVE_DATE | VALID |
| ONLINE_STATUS_IDX_1 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/ONLINE_STATUS_BI|ONLINE_STATUS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/ONLINE_STATUS_BU|ONLINE_STATUS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/DONSYS/Triggers/ONLINE_STATUS_SF_UPD|ONLINE_STATUS_SF_UPD]] — AFTER EACH ROW INSERT OR UPDATE (ENABLED)
- [[schemas/DONSYS/Triggers/VISTA_ELIGIBLE|VISTA_ELIGIBLE]] — AFTER EACH ROW INSERT OR UPDATE (ENABLED)

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
