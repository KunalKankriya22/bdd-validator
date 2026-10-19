---
tags:
  - table
  - DONSYS
---
# DONOR_EMPLOYERS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 25977
**Last Analyzed**: 2025-09-16 03:11:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EMPLOYER_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | EMPLOYER_NAME | VARCHAR2(50) | No |  |  |
| 4 | STREET_ADDRESS | VARCHAR2(30) | Yes |  |  |
| 5 | USPS_ID | NUMBER(6) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | INTL_CITY | VARCHAR2(50) | Yes |  |  |
| 13 | INTL_STATE | VARCHAR2(2) | Yes |  |  |
| 14 | INTL_POSTAL_CODE | VARCHAR2(15) | Yes |  |  |
| 15 | INTL_COUNTRY_NAME | VARCHAR2(50) | Yes |  |  |
| 16 | INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**DONOR_EMPLOYERS_PK**: `EMPLOYER_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/DONORS\|DONSYS.DONORS]] | EMPLOYER_DONOR_FK | EMPLOYER_ID, CHAPTER_ID → EMPLOYER_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_EMPLOYERS_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| DONOR_EMPLOYERS_IDX2 | NORMAL | NONUNIQUE | EMPLOYER_NAME | VALID |
| DONOR_EMPLOYERS_PK | NORMAL | UNIQUE | EMPLOYER_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_EMPLOYERS_BI|DONOR_EMPLOYERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
