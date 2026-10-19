---
tags:
  - table
  - SRVSYS
---
# PATIENT_DETAILS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SURGERY_REFNO | VARCHAR2(7) | Yes |  |  |
| 2 | PATIENT_SSN | VARCHAR2(11) | Yes |  |  |
| 3 | SURGERY_DATE | DATE | Yes |  |  |
| 4 | SURGERY_LOCNO | VARCHAR2(7) | Yes |  |  |
| 5 | SHIPPING_DEST | VARCHAR2(7) | Yes |  |  |
| 6 | SURGERY_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | ANTIBODY_SCREEN | VARCHAR2(3) | Yes |  |  |
| 8 | PHYSICIAN_SSN | VARCHAR2(11) | Yes |  |  |
| 9 | OUT_OF_STATE | VARCHAR2(1) | Yes |  |  |
| 10 | BLOOD_UNITS_REQD | NUMBER(3) | Yes |  |  |
| 11 | UNITS_TESTED_OK | NUMBER(3) | Yes |  |  |
| 12 | CHARGES_WAIVED | VARCHAR2(1) | Yes |  |  |
| 13 | EMERGENCY_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | TOTAL_CHARGES | NUMBER(10,2) | Yes |  |  |
| 15 | TOTAL_PAYMENTS | NUMBER(10,2) | Yes |  |  |
| 16 | AWARE_OF_CHARGES | VARCHAR2(1) | Yes |  |  |
| 17 | ABO_TYPE | VARCHAR2(5) | Yes |  |  |
| 18 | DIAGNOSIS | VARCHAR2(35) | Yes |  |  |
| 19 | REASON_WAIVED | VARCHAR2(50) | Yes |  |  |
| 20 | COMMENTS_1 | VARCHAR2(50) | Yes |  |  |
| 21 | COMMENTS_2 | VARCHAR2(50) | Yes |  |  |
| 22 | OTHER_DATA | VARCHAR2(25) | Yes |  |  |

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
