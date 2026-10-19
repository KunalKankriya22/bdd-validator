---
tags:
  - table
  - SBCSYS
---
# UNITS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 50821
**Last Analyzed**: 2026-05-23 15:07:18
**Partitioned**: NO

> [!quote] Created from Entity UNIT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | INSERT_DATS | DATE | No |  |  |
| 3 | AUDIT_KEY | NUMBER | No |  |  |
| 4 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 5 | COLL_DATE | DATE | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | DONOR_DECISION_CODE | VARCHAR2(1) | Yes |  |  |
| 8 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 9 | DRIVE_ID | VARCHAR2(6) | Yes |  |  |
| 10 | GROUP_SITE_ID | VARCHAR2(7) | Yes |  |  |
| 11 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 12 | CONTRACT_SUFFIX | VARCHAR2(4) | Yes |  |  |
| 13 | BAG_CODE | VARCHAR2(4) | Yes |  |  |
| 14 | ADD_ON_BAGS | NUMBER(2) | Yes |  |  |
| 15 | BLEED_START_TIME | DATE | Yes |  |  |
| 16 | BLEED_END_TIME | DATE | Yes |  |  |
| 17 | BAG_CHECK_IN_DATS | DATE | Yes |  |  |
| 18 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 19 | WORK_NUMBER | NUMBER(5) | Yes |  |  |
| 20 | RECEIVED_DATE | DATE | Yes |  |  |
| 21 | OS_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 22 | FIRST_SEP_CENTRIFUGE_ID | VARCHAR2(3) | Yes |  |  |
| 23 | FIRST_SEP_TIME | DATE | Yes |  |  |
| 24 | FIRST_SEP_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 25 | FIRST_SEP_USER_ID | VARCHAR2(6) | Yes |  |  |
| 26 | FIRST_SEP_ENTRY_MODE | VARCHAR2(1) | Yes |  |  |
| 27 | SECOND_SEP_CENTRIFUGE_ID | VARCHAR2(3) | Yes |  |  |
| 28 | SECOND_SEP_TIME | DATE | Yes |  |  |
| 29 | SECOND_SEP_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 30 | SECOND_SEP_USER_ID | VARCHAR2(6) | Yes |  |  |
| 31 | SECOND_SEP_ENTRY_MODE | VARCHAR2(1) | Yes |  |  |
| 32 | THIRD_SEP_CENTRIFUGE_ID | VARCHAR2(3) | Yes |  |  |
| 33 | THIRD_SEP_TIME | DATE | Yes |  |  |
| 34 | THIRD_SEP_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 35 | THIRD_SEP_USER_ID | VARCHAR2(6) | Yes |  |  |
| 36 | THIRD_SEP_ENTRY_MODE | VARCHAR2(1) | Yes |  |  |
| 37 | DONOR_FORM_ABO | VARCHAR2(4) | Yes |  |  |
| 38 | PRIOR_ABO | VARCHAR2(4) | Yes |  |  |
| 39 | CMV_STAT | VARCHAR2(4) | Yes |  |  |
| 40 | PRIOR_CMV_STAT | VARCHAR2(4) | Yes |  |  |
| 41 | SYSTEM_LABEL_DECISION | VARCHAR2(4) | Yes |  |  |
| 42 | REGISTRY_FLAG | VARCHAR2(1) | Yes |  |  |
| 43 | RARE_FLAG | VARCHAR2(1) | Yes |  |  |
| 44 | PRIOR_RARE_FLAG | VARCHAR2(1) | Yes |  |  |
| 45 | VRARE_FLAG | VARCHAR2(1) | Yes |  |  |
| 46 | PRIOR_VRARE_FLAG | VARCHAR2(1) | Yes |  |  |
| 47 | RED_TUBE_FLAG | VARCHAR2(1) | Yes |  |  |
| 48 | PURPLE_TUBE_FLAG | VARCHAR2(1) | Yes |  |  |
| 49 | SERUM_PLASMA_IND | VARCHAR2(1) | Yes |  |  |
| 50 | QC_CHECKIN_FLAG | VARCHAR2(1) | Yes |  |  |
| 51 | QC_CHECKIN_DATE | DATE | Yes |  |  |
| 52 | QC_TEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 53 | QC_TEST_DATE | DATE | Yes |  |  |
| 54 | QC_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 55 | QC_LABEL_DATE | DATE | Yes |  |  |
| 56 | NURSING_AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 57 | NURSING_AUDIT_STATUS | VARCHAR2(1) | Yes |  |  |
| 58 | COMPONENT_REVIEW_FLAG | VARCHAR2(1) | Yes |  |  |
| 59 | LAB_DIST_DATS | DATE | Yes |  |  |
| 60 | LAB_DONOR_DATS | DATE | Yes |  |  |
| 61 | DONOR_LAB_DATS | DATE | Yes |  |  |
| 62 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 63 | RED_TUBE2 | VARCHAR2(1) | Yes |  |  |
| 64 | CHK_DIGIT | VARCHAR2(1) | Yes |  |  |
| 65 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 66 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 67 | CATALOG_NUMBER | VARCHAR2(10) | Yes |  |  |
| 68 | RED_TUBE_2_FLAG | VARCHAR2(1) | Yes |  |  |
| 69 | CNF_CHECKIN_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/COMPONENTS\|SBCSYS.COMPONENTS]] | UNITS_COMPONENTS_FK | UNIT_ID, COLL_DATE, CHAPTER_ID → UNIT_ID, COLL_DATE, CHAPTER_ID |

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| UNITS_UK1 | UNIT_ID, COLL_DATE, CHAPTER_ID | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNITS_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID | VALID |
| UNITS_IDX_2 | NORMAL | NONUNIQUE | COLL_DATE | VALID |
| UNITS_IDX_3 | NORMAL | NONUNIQUE | RECEIVED_DATE | VALID |
| UNITS_IDX_4 | NORMAL | NONUNIQUE | BATCH_ID | VALID |
| UNITS_IDX_5 | NORMAL | NONUNIQUE | CONTRACT_ID, CHAPTER_ID, OS_UNIT_ID | VALID |
| UNITS_IDX_6 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/UNITS_BEFORE_DELETE|UNITS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/UNITS_BEFORE_INSERT|UNITS_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/UNITS_BEFORE_UPDATE|UNITS_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
