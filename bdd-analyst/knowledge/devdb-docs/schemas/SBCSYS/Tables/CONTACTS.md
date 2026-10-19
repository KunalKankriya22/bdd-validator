---
tags:
  - table
  - SBCSYS
---
# CONTACTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 593
**Last Analyzed**: 2025-09-16 03:14:25
**Partitioned**: NO

> [!quote] Created from Entity CONTACT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTACT_ID | NUMBER(6) | No |  |  |
| 2 | CONTACT_LAST_NAME | VARCHAR2(50) | No |  |  |
| 3 | CONTACT_FIRST_NAME | VARCHAR2(50) | No |  |  |
| 4 | CONTACT_TYPE | VARCHAR2(1) | No |  |  |
| 5 | CONTACT_TITLE | VARCHAR2(30) | Yes |  |  |
| 6 | CONTACT_SALUTATION | VARCHAR2(10) | Yes |  |  |
| 7 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 8 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 9 | PHONE_NUMBER | VARCHAR2(10) | Yes |  |  |
| 10 | FAX_NUMBER | VARCHAR2(10) | Yes |  |  |
| 11 | TELEX_NUMBER | VARCHAR2(10) | Yes |  |  |
| 12 | EMAIL_ID | VARCHAR2(50) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CONTACTS_IDX_1 | NORMAL | UNIQUE | CONTACT_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
