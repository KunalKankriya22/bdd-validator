---
tags:
  - table
  - SBCSYS
---
# UNITS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 24041459
**Last Analyzed**: 2025-09-16 03:14:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 3 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 4 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 5 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 6 | COLL_DATE | DATE | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 8 | DONOR_DECISION_CODE | VARCHAR2(1) | Yes |  |  |
| 9 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 10 | DRIVE_ID | VARCHAR2(6) | Yes |  |  |
| 11 | GROUP_SITE_ID | VARCHAR2(7) | Yes |  |  |
| 12 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 13 | CONTRACT_SUFFIX | VARCHAR2(4) | Yes |  |  |
| 14 | BAG_CODE | VARCHAR2(4) | Yes |  |  |
| 15 | ADD_ON_BAGS | NUMBER(2) | Yes |  |  |
| 16 | BLEED_START_TIME | DATE | Yes |  |  |
| 17 | BLEED_END_TIME | DATE | Yes |  |  |
| 18 | INSERT_DATS | DATE | Yes |  |  |
| 19 | BAG_CHECK_IN_DATS | DATE | Yes |  |  |
| 20 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 21 | WORK_NUMBER | NUMBER(5) | Yes |  |  |
| 22 | RECEIVED_DATE | DATE | Yes |  |  |
| 23 | OS_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 24 | FIRST_SEP_CENTRIFUGE_ID | VARCHAR2(3) | Yes |  |  |
| 25 | FIRST_SEP_TIME | DATE | Yes |  |  |
| 26 | FIRST_SEP_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 27 | FIRST_SEP_USER_ID | VARCHAR2(6) | Yes |  |  |
| 28 | FIRST_SEP_ENTRY_MODE | VARCHAR2(1) | Yes |  |  |
| 29 | SECOND_SEP_CENTRIFUGE_ID | VARCHAR2(3) | Yes |  |  |
| 30 | SECOND_SEP_TIME | DATE | Yes |  |  |
| 31 | SECOND_SEP_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 32 | SECOND_SEP_USER_ID | VARCHAR2(6) | Yes |  |  |
| 33 | SECOND_SEP_ENTRY_MODE | VARCHAR2(1) | Yes |  |  |
| 34 | THIRD_SEP_CENTRIFUGE_ID | VARCHAR2(3) | Yes |  |  |
| 35 | THIRD_SEP_TIME | DATE | Yes |  |  |
| 36 | THIRD_SEP_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 37 | THIRD_SEP_USER_ID | VARCHAR2(6) | Yes |  |  |
| 38 | THIRD_SEP_ENTRY_MODE | VARCHAR2(1) | Yes |  |  |
| 39 | DONOR_FORM_ABO | VARCHAR2(4) | Yes |  |  |
| 40 | PRIOR_ABO | VARCHAR2(4) | Yes |  |  |
| 41 | CMV_STAT | VARCHAR2(4) | Yes |  |  |
| 42 | PRIOR_CMV_STAT | VARCHAR2(4) | Yes |  |  |
| 43 | SYSTEM_LABEL_DECISION | VARCHAR2(4) | Yes |  |  |
| 44 | REGISTRY_FLAG | VARCHAR2(1) | Yes |  |  |
| 45 | RARE_FLAG | VARCHAR2(1) | Yes |  |  |
| 46 | PRIOR_RARE_FLAG | VARCHAR2(1) | Yes |  |  |
| 47 | VRARE_FLAG | VARCHAR2(1) | Yes |  |  |
| 48 | PRIOR_VRARE_FLAG | VARCHAR2(1) | Yes |  |  |
| 49 | RED_TUBE_FLAG | VARCHAR2(1) | Yes |  |  |
| 50 | PURPLE_TUBE_FLAG | VARCHAR2(1) | Yes |  |  |
| 51 | SERUM_PLASMA_IND | VARCHAR2(1) | Yes |  |  |
| 52 | QC_CHECKIN_FLAG | VARCHAR2(1) | Yes |  |  |
| 53 | QC_CHECKIN_DATE | DATE | Yes |  |  |
| 54 | QC_TEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 55 | QC_TEST_DATE | DATE | Yes |  |  |
| 56 | QC_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 57 | QC_LABEL_DATE | DATE | Yes |  |  |
| 58 | NURSING_AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 59 | NURSING_AUDIT_STATUS | VARCHAR2(1) | Yes |  |  |
| 60 | COMPONENT_REVIEW_FLAG | VARCHAR2(1) | Yes |  |  |
| 61 | LAB_DIST_DATS | DATE | Yes |  |  |
| 62 | LAB_DONOR_DATS | DATE | Yes |  |  |
| 63 | DONOR_LAB_DATS | DATE | Yes |  |  |
| 64 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 65 | RED_TUBE2 | VARCHAR2(1) | Yes |  |  |
| 66 | CHK_DIGIT | VARCHAR2(1) | Yes |  |  |
| 67 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 68 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 69 | CATALOG_NUMBER | VARCHAR2(10) | Yes |  |  |
| 70 | RED_TUBE_2_FLAG | VARCHAR2(1) | Yes |  |  |
| 71 | CNF_CHECKIN_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNITS_AUDIT_IDX1 | NORMAL | NONUNIQUE | UNIT_ID | VALID |
| UNITS_AUDIT_IDX2 | NORMAL | NONUNIQUE | UNIT_ID, INSERT_DATS | VALID |
| UNITS_AUDIT_N1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
