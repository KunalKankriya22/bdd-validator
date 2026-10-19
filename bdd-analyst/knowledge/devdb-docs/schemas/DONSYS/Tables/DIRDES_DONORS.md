---
tags:
  - table
  - DONSYS
---
# DIRDES_DONORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2706
**Last Analyzed**: 2025-09-16 03:10:41
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PAT_ID | VARCHAR2(10) | No |  |  |
| 2 | SURG_ID | VARCHAR2(10) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | SEQ_NO | NUMBER(3) | No |  |  |
| 5 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 6 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 7 | CONTACT_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | CONTACT_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 9 | PROD_TYPE1 | VARCHAR2(5) | Yes |  |  |
| 10 | PROD_TYPE2 | VARCHAR2(5) | Yes |  |  |
| 11 | PROD_TYPE3 | VARCHAR2(5) | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 13 | INSERT_DATE | DATE | No |  |  |
| 14 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | INTL_CONTACT_PHONE_NO | VARCHAR2(20) | Yes |  |  |

## Primary Key

**DIRDES_DONORS_PK**: `PAT_ID, SURG_ID, CHAPTER_ID, SEQ_NO`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DIRDES_DONORS_PK | NORMAL | UNIQUE | PAT_ID, SURG_ID, CHAPTER_ID, SEQ_NO | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DIRDES_DONORS_BI|DIRDES_DONORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
