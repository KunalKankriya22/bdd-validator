---
tags:
  - table
  - DONSYS
---
# PATIENT_RBC_ANTIBODIES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 63
**Last Analyzed**: 2025-09-16 03:14:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PATIENT_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | RESULT_CODE | VARCHAR2(5) | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 6 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**PATIENT_RBC_ANTIBODIES_PK**: `PATIENT_ID, CHAPTER_ID, TEST_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PATIENT_RBC_ANTIBODIES_PK | NORMAL | UNIQUE | PATIENT_ID, CHAPTER_ID, TEST_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/PATIENT_RBC_ANTIBODIES_BD|PATIENT_RBC_ANTIBODIES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/PATIENT_RBC_ANTIBODIES_BI|PATIENT_RBC_ANTIBODIES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/PATIENT_RBC_ANTIBODIES_BU|PATIENT_RBC_ANTIBODIES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
