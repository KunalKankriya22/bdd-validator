---
tags:
  - table
  - SBCSYS
---
# VALID_TESTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 237
**Last Analyzed**: 2026-04-24 03:00:04
**Partitioned**: NO

> [!quote] Created from Entity VALID TEST by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | TEST_DESC | VARCHAR2(50) | No |  |  |
| 3 | TEST_SHORT_ID | VARCHAR2(6) | No |  |  |
| 4 | TEST_GROUP | VARCHAR2(5) | Yes |  |  |
| 5 | ANTIGEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | EDIT_RESULT_FLAG | VARCHAR2(1) | No |  |  |
| 7 | DISCREPANCY_FLAG | VARCHAR2(1) | No |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | SERVICE_CODE | VARCHAR2(12) | Yes |  |  |
| 14 | TESTING_CHARGES_CURR | NUMBER(6,2) | Yes |  |  |
| 15 | TESTING_CHARGES_NEW | NUMBER(6,2) | Yes |  |  |
| 16 | IMPLEMENT_DATS | DATE | Yes |  |  |
| 17 | NO_OF_TECH | NUMBER(1) | Yes |  |  |
| 18 | FULL_TECH_2 | VARCHAR2(1) | Yes |  |  |
| 19 | AUTO_SCHEDULE | VARCHAR2(1) | Yes |  |  |

## Primary Key

**VALID_TESTS_PK**: `TEST_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/FR_VANTIGEN_GROUPS\|SBCSYS.FR_VANTIGEN_GROUPS]] | TESTS_FR_VANTIGEN_GROUPS_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/FR_VRARITY_MATRIX_DET\|SBCSYS.FR_VRARITY_MATRIX_DET]] | TESTS_FR_VRARITY_MTX_DET_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/TEST_BAND_HEADER\|SBCSYS.TEST_BAND_HEADER]] | TEST_TEST_BAND_HDR_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/TEST_BATCH_DET\|SBCSYS.TEST_BATCH_DET]] | TEST_TEST_BATCH_DET_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/TEST_KITS\|SBCSYS.TEST_KITS]] | TEST_TEST_KITS_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/TEST_KIT_CLASS\|SBCSYS.TEST_KIT_CLASS]] | TEST_TEST_KIT_CLASS_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/TEST_ORDERS\|SBCSYS.TEST_ORDERS]] | TEST_TEST_ORDERS_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/TEST_PARMS\|SBCSYS.TEST_PARMS]] | TEST_TEST_PARMS_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/TEST_RUN_HDR\|SBCSYS.TEST_RUN_HDR]] | TEST_TEST_RUN_HDR_FK | TEST_ID → TEST_ID |
| [[schemas/SBCSYS/Tables/TEST_VOIDS\|SBCSYS.TEST_VOIDS]] | TEST_TEST_VOIDS_FK | TEST_ID → TEST_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_TESTS_IDX_1 | NORMAL | UNIQUE | TEST_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_TESTS_BEFORE_DELETE|VALID_TESTS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_TESTS_INSERT_UPDATE|VALID_TESTS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
