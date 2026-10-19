---
tags:
  - table
  - SBCSYS
---
# CONTRACTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4596
**Last Analyzed**: 2025-09-16 03:14:26
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | COMPANY | VARCHAR2(50) | Yes |  |  |
| 4 | CONTRACT_TYPE | VARCHAR2(2) | Yes |  |  |
| 5 | ADDRESS_ID | NUMBER(6) | Yes |  |  |
| 6 | MACHINE_CODE | VARCHAR2(2) | Yes |  |  |
| 7 | TAX_ID_FORM | VARCHAR2(9) | Yes |  |  |
| 8 | CENTER_ID | VARCHAR2(5) | Yes |  |  |
| 9 | BAR_CODE_PROTOCOL | VARCHAR2(1) | Yes |  |  |
| 10 | UNIT_ID_PATTERN | VARCHAR2(1) | Yes |  |  |
| 11 | EDI_INPUT_IND | VARCHAR2(1) | Yes |  |  |
| 12 | RESULT_OUTPUT_IND | VARCHAR2(1) | Yes |  |  |
| 13 | CONFIRM_TEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | EFF_DATE | DATE | Yes |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 17 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 18 | AUDIT_KEY | NUMBER | No |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 20 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 21 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 22 | STAT_TESTING_FLAG | VARCHAR2(1) | Yes |  |  |
| 23 | CBC_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 24 | UNIT_ID_TYPE | VARCHAR2(1) | Yes |  |  |
| 25 | RESULTS_METHOD | VARCHAR2(1) | Yes |  |  |
| 26 | OD_REPORTING_METHOD | VARCHAR2(1) | Yes |  |  |
| 27 | PO_NO | VARCHAR2(15) | Yes |  |  |
| 28 | PLATE_CAPACITY | NUMBER(6) | Yes |  |  |
| 29 | PROFILE_SEQ_NO | NUMBER(6) | Yes |  |  |
| 30 | ALT_E_LEVEL | NUMBER(7,2) | Yes |  |  |
| 31 | ALT_SE_LEVEL | NUMBER(7,2) | Yes |  |  |
| 32 | RED_TUBE_COUNT | NUMBER(2) | Yes |  |  |
| 33 | PURBLE_TUBE_COUNT | NUMBER(2) | Yes |  |  |
| 34 | PURPLE_TUBE_COUNT | NUMBER(2) | Yes |  |  |
| 35 | EMAIL_ID | VARCHAR2(50) | Yes |  |  |
| 36 | COPY_ISBT_FLAG | VARCHAR2(1) | Yes |  |  |
| 37 | DUP_CHECKIN_FLAG | VARCHAR2(1) | Yes |  |  |
| 38 | NO_OF_DUPLICATES | NUMBER(2) | Yes |  |  |
| 39 | INT_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CONTRACTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
