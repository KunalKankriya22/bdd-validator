---
tags:
  - table
  - DONSYS
---
# MERGED_DONORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 374
**Last Analyzed**: 2025-09-16 03:13:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRIMARY_DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | SECONDARY_DONOR_ID | VARCHAR2(10) | No |  |  |
| 4 | S_GENDER | VARCHAR2(1) | No |  |  |
| 5 | S_DATE_OF_BIRTH | DATE | No |  |  |
| 6 | S_LAST_NAME | VARCHAR2(30) | No |  |  |
| 7 | S_SSN | NUMBER(9) | Yes |  |  |
| 8 | S_LAST_NAME_SUFFIX | VARCHAR2(5) | Yes |  |  |
| 9 | S_FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 10 | S_MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 11 | S_SALUTATION | VARCHAR2(5) | Yes |  |  |
| 12 | S_BLOOD_TYPE | VARCHAR2(5) | Yes |  |  |
| 13 | S_EMPLOYER_ID | VARCHAR2(10) | Yes |  |  |
| 14 | S_TITLE | VARCHAR2(10) | Yes |  |  |
| 15 | S_ETHNIC_GROUP | VARCHAR2(5) | Yes |  |  |
| 16 | S_PREVIOS_DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 17 | S_ALIAS | VARCHAR2(15) | Yes |  |  |
| 18 | S_CLAIMED_DONATION | NUMBER(5) | Yes |  |  |
| 19 | S_ALTERNATE_ID | VARCHAR2(20) | Yes |  |  |
| 20 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 21 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 22 | INSERT_DATE | DATE | No |  |  |
| 23 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**MERGED_DONORS_PK**: `PRIMARY_DONOR_ID, CHAPTER_ID, SECONDARY_DONOR_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MERGED_DONORS_PK | NORMAL | UNIQUE | PRIMARY_DONOR_ID, CHAPTER_ID, SECONDARY_DONOR_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/MERGED_DONORS_AG_BI|MERGED_DONORS_AG_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/MERGED_DONORS_BI|MERGED_DONORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
