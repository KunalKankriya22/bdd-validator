---
tags:
  - table
  - DONSYS
---
# HLA_RBC_REQUEST

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1109
**Last Analyzed**: 2026-05-16 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REQUEST_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PATIENT_ID | VARCHAR2(10) | No |  |  |
| 4 | HOSPITAL_ID | VARCHAR2(10) | No |  |  |
| 5 | REQUESTED_DATE | DATE | No |  |  |
| 6 | BLOOD_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | CLOSE_DATE | DATE | Yes |  |  |
| 8 | HLA_PHENO | VARCHAR2(1) | Yes |  |  |
| 9 | HLA_ANTI | VARCHAR2(1) | Yes |  |  |
| 10 | RBC_ANTI | VARCHAR2(1) | Yes |  |  |
| 11 | LIST_ID | VARCHAR2(10) | Yes |  |  |
| 12 | STATUS | VARCHAR2(5) | Yes |  |  |
| 13 | REQ_DIAGNOSIS | VARCHAR2(250) | Yes |  |  |
| 14 | PHYSICIAN_ID | VARCHAR2(10) | Yes |  |  |
| 15 | RBC_PHENO | VARCHAR2(1) | Yes |  |  |
| 16 | EXP_TRANSFUSION_DATE1 | DATE | Yes |  |  |
| 17 | QUANTITY1 | NUMBER(3) | Yes |  |  |
| 18 | EXP_TRANSFUSION_DATE2 | DATE | Yes |  |  |
| 19 | QUANTITY2 | NUMBER(3) | Yes |  |  |
| 20 | EXP_TRANSFUSION_DATE3 | DATE | Yes |  |  |
| 21 | QUANTITY3 | NUMBER(3) | Yes |  |  |
| 22 | EXP_TRANSFUSION_DATE4 | DATE | Yes |  |  |
| 23 | QUANTITY4 | NUMBER(3) | Yes |  |  |
| 24 | EXP_TRANSFUSION_DATE5 | DATE | Yes |  |  |
| 25 | QUANTITY5 | NUMBER(3) | Yes |  |  |
| 26 | EXP_TRANSFUSION_DATE6 | DATE | Yes |  |  |
| 27 | QUANTITY6 | NUMBER(3) | Yes |  |  |
| 28 | EXP_TRANSFUSION_DATE7 | DATE | Yes |  |  |
| 29 | QUANTITY7 | NUMBER(3) | Yes |  |  |
| 30 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 31 | CONTACT_PERSON | VARCHAR2(50) | Yes |  |  |
| 32 | CONTACT_PHONE | VARCHAR2(10) | Yes |  |  |
| 33 | PRIORITY | VARCHAR2(5) | Yes |  |  |
| 34 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 35 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 36 | INSERT_DATE | DATE | No |  |  |
| 37 | AUDIT_KEY | NUMBER | No |  |  |
| 38 | CONSIGNEE_ID | VARCHAR2(10) | Yes |  |  |
| 39 | SUBMIT_REQUEST | VARCHAR2(1) | Yes |  |  |
| 40 | EXACT_MATCH | VARCHAR2(1) | Yes |  |  |
| 41 | UNIT_REQUEST | VARCHAR2(1) | Yes |  |  |
| 42 | INTL_CONTACT_PHONE | VARCHAR2(20) | Yes |  |  |

## Primary Key

**HLA_RBC_REQUEST_PK**: `REQUEST_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/HLARBC_REQUEST_DETAILS\|DONSYS.HLARBC_REQUEST_DETAILS]] | REQS_HLARBC_REQS_DET_FK | REQUEST_ID, CHAPTER_ID → REQUEST_ID, CHAPTER_ID |
| [[schemas/DONSYS/Tables/HLA_RBC_MATCH_LISTS\|DONSYS.HLA_RBC_MATCH_LISTS]] | REQS_HLA_RBC_MATCH_LISTS_FK | REQUEST_ID, CHAPTER_ID → REQUEST_ID, CHAPTER_ID |
| [[schemas/DONSYS/Tables/HLA_RBC_MATCH_TEMP\|DONSYS.HLA_RBC_MATCH_TEMP]] | REQS_HLA_RBC_MATCH_TEMP_FK | REQUEST_ID, CHAPTER_ID → REQUEST_ID, CHAPTER_ID |
| [[schemas/DONSYS/Tables/HLA_RBC_MATCH_UNITS\|DONSYS.HLA_RBC_MATCH_UNITS]] | REQS_HLA_RBC_MATCH_UNITS_FK | REQUEST_ID, CHAPTER_ID → REQUEST_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HLA_RBC_REQUEST_PK | NORMAL | UNIQUE | REQUEST_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/HLA_RBC_REQUEST_BD|HLA_RBC_REQUEST_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/HLA_RBC_REQUEST_BI|HLA_RBC_REQUEST_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/HLA_RBC_REQUEST_BU|HLA_RBC_REQUEST_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
