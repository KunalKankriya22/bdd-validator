---
tags:
  - table
  - LTAPI
---
# API_INST_TEST_RESULTS_ARC

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 835
**Last Analyzed**: 2026-03-10 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MACHINE_ID | VARCHAR2(5) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | FILE_ID | VARCHAR2(50) | Yes |  |  |
| 4 | UNIT_ID | VARCHAR2(16) | Yes |  |  |
| 5 | COLL_DATE | DATE | Yes |  |  |
| 6 | MACHINE_TEST_ID | VARCHAR2(10) | Yes |  |  |
| 7 | MACHINE_RESULT | VARCHAR2(30) | Yes |  |  |
| 8 | TEST_ID_1 | VARCHAR2(30) | Yes |  |  |
| 9 | RESULT_1 | VARCHAR2(10) | Yes |  |  |
| 10 | TEST_ID_2 | VARCHAR2(30) | Yes |  |  |
| 11 | RESULT_2 | VARCHAR2(10) | Yes |  |  |
| 12 | TEST_ID_3 | VARCHAR2(30) | Yes |  |  |
| 13 | RESULT_3 | VARCHAR2(10) | Yes |  |  |
| 14 | TEST_ID_4 | VARCHAR2(30) | Yes |  |  |
| 15 | RESULT_4 | VARCHAR2(10) | Yes |  |  |
| 16 | TEST_ID_5 | VARCHAR2(30) | Yes |  |  |
| 17 | RESULT_5 | VARCHAR2(10) | Yes |  |  |
| 18 | TEST_ID_6 | VARCHAR2(30) | Yes |  |  |
| 19 | RESULT_6 | VARCHAR2(10) | Yes |  |  |
| 20 | LOWER_RESULT_RANGE | VARCHAR2(30) | Yes |  |  |
| 21 | UPPER_RESULT_RANGE | VARCHAR2(30) | Yes |  |  |
| 22 | WELL_NUMBER | NUMBER | Yes |  |  |
| 23 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 24 | RATIO | VARCHAR2(17) | Yes |  |  |
| 25 | PLATE_ID | VARCHAR2(40) | Yes |  |  |
| 26 | RESULT_DATE | DATE | Yes |  |  |
| 27 | RESULT_USER_ID | VARCHAR2(30) | Yes |  |  |
| 28 | ERROR_CODE | VARCHAR2(10) | Yes |  |  |
| 29 | RECORD_SEQUENCE | NUMBER | Yes |  |  |
| 30 | PATIENT_LAST_NAME | VARCHAR2(50) | Yes |  |  |
| 31 | PATIENT_FIRST_NAME | VARCHAR2(50) | Yes |  |  |
| 32 | PATIENT_DOB | DATE | Yes |  |  |
| 33 | COMMENTS | VARCHAR2(300) | Yes |  |  |
| 34 | SKIP_RECORD | VARCHAR2(1) | Yes |  |  |
| 35 | UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 36 | INSERT_DATE | DATE | Yes |  |  |
| 37 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 38 | AUDIT_KEY | NUMBER | Yes |  |  |
| 39 | FINAL_POOL_SIZE | NUMBER | Yes |  |  |
| 40 | EXT_BATCH_ID | VARCHAR2(30) | Yes |  |  |
| 41 | SITE_ID | VARCHAR2(20) | Yes |  |  |
| 42 | PARSED_BY | VARCHAR2(5) | Yes |  |  |
| 43 | RECORD_ID | NUMBER | Yes |  |  |

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
