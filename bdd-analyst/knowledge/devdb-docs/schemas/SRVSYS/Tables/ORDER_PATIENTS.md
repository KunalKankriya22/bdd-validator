---
tags:
  - table
  - SRVSYS
---
# ORDER_PATIENTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 887
**Last Analyzed**: 2025-09-16 03:16:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PATIENT_NAME | VARCHAR2(50) | Yes |  |  |
| 4 | DOCTOR_NAME | VARCHAR2(50) | Yes |  |  |
| 5 | PATIENT_ID | VARCHAR2(20) | Yes |  |  |
| 6 | PATIENT_ABORH | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ORDER_PATIENTS_IDX_1 | NORMAL | NONUNIQUE | ORDER_NO, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
