---
tags:
  - table
  - SBCSYS
---
# LABELING_TEST_MESSAGE_MAP_ADT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 332
**Last Analyzed**: 2025-09-16 03:14:31
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LT_TEST_ID | VARCHAR2(10) | Yes |  |  |
| 2 | RESULT_CODE | VARCHAR2(10) | Yes |  |  |
| 3 | DISPLY_TEST_ID | VARCHAR2(20) | Yes |  |  |
| 4 | MESSAGE_DESC | VARCHAR2(200) | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | AUDIT_USER | VARCHAR2(30) | Yes |  |  |
| 12 | AUDIT_DATE | DATE | Yes |  |  |

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
