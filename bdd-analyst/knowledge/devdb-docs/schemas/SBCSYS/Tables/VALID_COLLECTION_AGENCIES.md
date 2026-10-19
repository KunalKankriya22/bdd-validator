---
tags:
  - table
  - SBCSYS
---
# VALID_COLLECTION_AGENCIES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 405
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
| 19 | REGISTRATION_NO | VARCHAR2(40) | Yes |  |  |
| 20 | LICENCE_NO | VARCHAR2(40) | Yes |  |  |
| 21 | COUNTRY | VARCHAR2(15) | Yes |  |  |
| 22 | INT_PHONE_NUMBER | VARCHAR2(15) | Yes |  |  |
| 23 | LICENCE_ADDRESS_1 | VARCHAR2(100) | Yes |  |  |
| 24 | LICENCE_ADDRESS_2 | VARCHAR2(100) | Yes |  |  |
| 25 | LICENCE_ADDRESS_3 | VARCHAR2(100) | Yes |  |  |
| 26 | LICENCE_CITY | VARCHAR2(75) | Yes |  |  |
| 27 | LICENCE_STATE | VARCHAR2(20) | Yes |  |  |
| 28 | LICENCE_ZIP | VARCHAR2(8) | Yes |  |  |
| 29 | LICENCE_COUNTRY | VARCHAR2(15) | Yes |  |  |
| 30 | INT_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_COLL_AGEN_BEFORE_DELETE|VALID_COLL_AGEN_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_COLL_AGEN_INSERT_UPDATE|VALID_COLL_AGEN_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
