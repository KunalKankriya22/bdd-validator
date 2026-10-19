---
tags:
  - table
  - LTAPI
---
# API_PATHOGEN_REDUCTION_ARCH

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 204
**Last Analyzed**: 2025-03-18 03:00:39
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | FILE_ID | VARCHAR2(240) | No |  |  |
| 2 | INSTRUMENT_CODE | VARCHAR2(15) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | UNIT_SUFFIX | VARCHAR2(5) | Yes |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 6 | TREATMENT_START_TIME | DATE | No |  |  |
| 7 | TOTAL_TREATMENT_TIME | VARCHAR2(10) | Yes |  |  |
| 8 | DOSAGE_MEASURED | NUMBER | Yes |  |  |
| 9 | STATUS | VARCHAR2(1) | No |  |  |
| 10 | TARGET_DOSE | NUMBER | Yes |  |  |
| 11 | OPERATOR_ID | VARCHAR2(30) | Yes |  |  |
| 12 | CHAMBER_NUMBER | VARCHAR2(1) | Yes |  |  |
| 13 | AGITATION_TIME | VARCHAR2(10) | Yes |  |  |
| 14 | INST_MESSAGE_CODE | VARCHAR2(200) | Yes |  |  |
| 15 | SOFTWARE_VERSION | VARCHAR2(10) | Yes |  |  |
| 16 | SITE_CODE | VARCHAR2(10) | No |  |  |
| 17 | LOT_NUMBER | VARCHAR2(10) | No |  |  |
| 18 | SET_CODE | VARCHAR2(20) | No |  |  |
| 19 | CHECK_SUM | VARCHAR2(20) | Yes |  |  |
| 20 | RECORD_STATUS | VARCHAR2(1) | Yes |  |  |
| 21 | INSERT_DATE | DATE | No |  |  |
| 22 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 23 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 24 | AUDIT_KEY | NUMBER | No |  |  |
| 25 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

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
