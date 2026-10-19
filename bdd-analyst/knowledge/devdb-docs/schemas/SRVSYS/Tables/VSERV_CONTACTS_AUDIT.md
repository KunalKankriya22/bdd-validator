---
tags:
  - table
  - SRVSYS
---
# VSERV_CONTACTS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2839
**Last Analyzed**: 2025-09-16 03:16:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | LAST_NAME | VARCHAR2(50) | Yes |  |  |
| 4 | FIRST_NAME | VARCHAR2(50) | Yes |  |  |
| 5 | CONTACT_TYPE | VARCHAR2(1) | Yes |  |  |
| 6 | INST_ID | VARCHAR2(4) | Yes |  |  |
| 7 | SALUTATION | VARCHAR2(10) | Yes |  |  |
| 8 | TITLE | VARCHAR2(10) | Yes |  |  |
| 9 | DAY_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 10 | NIGHT_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 11 | FAX_NO | VARCHAR2(20) | Yes |  |  |
| 12 | TELEX_NO | VARCHAR2(20) | Yes |  |  |
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 18 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 19 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_CONTACTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
