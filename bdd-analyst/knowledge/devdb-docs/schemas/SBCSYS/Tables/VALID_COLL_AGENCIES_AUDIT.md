---
tags:
  - table
  - SBCSYS
---
# VALID_COLL_AGENCIES_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 789
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | COLL_ID | VARCHAR2(5) | No |  |  |
| 4 | COLL_NAME | VARCHAR2(101) | Yes |  |  |
| 5 | COLL_ADDRESS_1 | VARCHAR2(100) | Yes |  |  |
| 6 | COLL_ADDRESS_2 | VARCHAR2(100) | Yes |  |  |
| 7 | COLL_ADDRESS_3 | VARCHAR2(100) | Yes |  |  |
| 8 | CITY | VARCHAR2(75) | Yes |  |  |
| 9 | STATE | VARCHAR2(20) | Yes |  |  |
| 10 | ZIP | VARCHAR2(8) | Yes |  |  |
| 11 | COLL_ID_HEAD | VARCHAR2(40) | Yes |  |  |
| 12 | PHONE_NO | VARCHAR2(13) | Yes |  |  |
| 13 | FAX_NO | VARCHAR2(15) | Yes |  |  |
| 14 | EFF_DATE | DATE | Yes |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 17 | AUDIT_KEY | NUMBER | Yes |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 19 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 20 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 21 | COUNTRY | VARCHAR2(15) | Yes |  |  |
| 22 | INT_PHONE_NUMBER | VARCHAR2(15) | Yes |  |  |

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
