---
tags:
  - table
  - DONSYS
---
# WEB_HH_HEADER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(15) | Yes |  |  |
| 2 | WEB_ID | VARCHAR2(15) | No |  |  |
| 3 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 4 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 5 | GENDER | VARCHAR2(1) | Yes |  |  |
| 6 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 7 | SSN | NUMBER(9) | Yes |  |  |
| 8 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 9 | NICK_NAME | VARCHAR2(25) | Yes |  |  |
| 10 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 11 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | HH_COPY_DATE | DATE | Yes |  |  |
| 14 | HH_COPY_USER | VARCHAR2(8) | Yes |  |  |
| 15 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 16 | LOCATOR_ID | VARCHAR2(10) | No |  |  |

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
