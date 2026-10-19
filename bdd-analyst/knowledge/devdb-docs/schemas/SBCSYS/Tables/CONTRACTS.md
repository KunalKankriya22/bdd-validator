---
tags:
  - table
  - SBCSYS
---
# CONTRACTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 608
**Last Analyzed**: 2025-09-16 03:14:25
**Partitioned**: NO

> [!quote] Created from Entity CONTRACT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | COMPANY | VARCHAR2(50) | No |  |  |
| 4 | CONTRACT_TYPE | VARCHAR2(2) | No |  |  |
| 5 | ADDRESS_ID | NUMBER(6) | No |  |  |
| 6 | MACHINE_CODE | VARCHAR2(2) | Yes |  |  |
| 7 | TAX_ID_FORM | VARCHAR2(9) | Yes |  |  |
| 8 | CENTER_ID | VARCHAR2(5) | Yes |  |  |
| 9 | BAR_CODE_PROTOCOL | VARCHAR2(1) | No |  |  |
| 10 | UNIT_ID_PATTERN | VARCHAR2(1) | Yes |  |  |
| 11 | EDI_INPUT_IND | VARCHAR2(1) | Yes |  |  |
| 12 | RESULT_OUTPUT_IND | VARCHAR2(1) | Yes |  |  |
| 13 | CONFIRM_TEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | EFF_DATE | DATE | No |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 17 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 18 | AUDIT_KEY | NUMBER | No |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 20 | CBC_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 21 | UNIT_ID_TYPE | VARCHAR2(1) | Yes |  |  |
| 22 | RESULTS_METHOD | VARCHAR2(1) | Yes |  |  |
| 23 | OD_REPORTING_METHOD | VARCHAR2(1) | Yes |  |  |
| 24 | PO_NO | VARCHAR2(15) | Yes |  |  |
| 25 | PLATE_CAPACITY | NUMBER(6) | Yes |  |  |
| 26 | ALT_E_LEVEL | NUMBER(7,2) | Yes |  |  |
| 27 | ALT_SE_LEVEL | NUMBER(7,2) | Yes |  |  |
| 28 | PROFILE_SEQ_NO | NUMBER(6) | Yes |  |  |
| 29 | RED_TUBE_COUNT | NUMBER(2) | Yes |  |  |
| 30 | PURBLE_TUBE_COUNT | NUMBER(2) | Yes |  |  |
| 31 | PURPLE_TUBE_COUNT | NUMBER(2) | Yes |  |  |
| 32 | EMAIL_ID | VARCHAR2(50) | Yes |  |  |
| 33 | COPY_ISBT_FLAG | VARCHAR2(1) | Yes |  |  |
| 34 | DUP_CHECKIN_FLAG | VARCHAR2(1) | Yes |  |  |
| 35 | NO_OF_DUPLICATES | NUMBER(2) | Yes |  |  |
| 36 | INT_FLAG | VARCHAR2(1) | Yes |  |  |
| 37 | DISP_CHKDIGIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 38 | NON_PROFILE_EF | VARCHAR2(1) | Yes |  |  |

## Primary Key

**CONTRACTS_PK**: `CONTRACT_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/BATCH_INPUTS\|SBCSYS.BATCH_INPUTS]] | CONTRACT_BATCH_INPUT_FK | CONTRACT_ID, CHAPTER_ID → CONTRACT_ID, CHAPTER_ID |
| [[schemas/SBCSYS/Tables/RGT_BATCH\|SBCSYS.RGT_BATCH]] | CONTRACT_RGT_BATCH_FK | CONTRACT_ID, CHAPTER_ID → CONTRACT_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CONTRACTS_IDX_1 | NORMAL | UNIQUE | CONTRACT_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/CONTRACTS_BEFORE_DELETE|CONTRACTS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/CONTRACTS_INSERT_UPDATE|CONTRACTS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
