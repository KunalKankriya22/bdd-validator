---
tags:
  - table
  - SBCSYS
---
# BATCH_INPUTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 15768
**Last Analyzed**: 2026-05-24 11:00:11
**Partitioned**: NO

> [!quote] Created from Entity BATCH INPUT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
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
| 14 | CHECKIN_USER_ID | VARCHAR2(6) | No |  |  |
| 15 | INSERT_DATS | DATE | No |  |  |
| 16 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 17 | RESULTS_QC_DATE | DATE | Yes |  |  |
| 18 | RESULTS_QC_USER | VARCHAR2(6) | Yes |  |  |
| 19 | PROFILE_SEQ_NO | NUMBER(6) | Yes |  |  |
| 20 | AUDIT_KEY | NUMBER | Yes |  |  |
| 21 | PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 22 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**BATCH_INPUTS_PK**: `BATCH_ID, CHAPTER_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| CONTRACT_BATCH_INPUT_FK | CONTRACT_ID, CHAPTER_ID | [[schemas/SBCSYS/Tables/CONTRACTS\|SBCSYS.CONTRACTS]] (CONTRACT_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| BATCH_INPUTS_IDX_1 | NORMAL | UNIQUE | BATCH_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/BATCH_INPUTS_BEFORE_DELETE|BATCH_INPUTS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/BATCH_INPUTS_BEFORE_UPDATE|BATCH_INPUTS_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/SBCSYS/Triggers/BATCH_INPUTS_BI|BATCH_INPUTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
