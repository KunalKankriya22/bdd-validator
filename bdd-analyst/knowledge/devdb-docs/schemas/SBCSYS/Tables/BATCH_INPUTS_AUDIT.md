---
tags:
  - table
  - SBCSYS
---
# BATCH_INPUTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7825
**Last Analyzed**: 2025-09-16 03:14:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 4 | CONTRACT_SUFFIX | VARCHAR2(4) | Yes |  |  |
| 5 | NUMBER_OF_UNITS | NUMBER(5) | Yes |  |  |
| 6 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | CARTON_COUNT | NUMBER(2) | Yes |  |  |
| 8 | AIRWAY_BILL_NO | VARCHAR2(14) | Yes |  |  |
| 9 | SHIPPED_DATE | DATE | Yes |  |  |
| 10 | RECEIVED_DATE | DATE | Yes |  |  |
| 11 | MIN_TEMP | NUMBER(5,2) | Yes |  |  |
| 12 | MAX_TEMP | NUMBER(5,2) | Yes |  |  |
| 13 | QC_DATE | DATE | Yes |  |  |
| 14 | CHECKIN_USER_ID | VARCHAR2(6) | Yes |  |  |
| 15 | INSERT_DATS | DATE | Yes |  |  |
| 16 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 17 | RESULTS_QC_DATE | DATE | Yes |  |  |
| 18 | RESULTS_QC_USER | VARCHAR2(6) | Yes |  |  |
| 19 | PROFILE_SEQ_NO | NUMBER(6) | Yes |  |  |
| 20 | AUDIT_KEY | NUMBER | Yes |  |  |
| 21 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 22 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
