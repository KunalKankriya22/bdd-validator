---
tags:
  - table
  - SBCSYS
---
# VALID_TESTING_LABS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 14
**Last Analyzed**: 2025-09-16 03:16:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TESTING_LAB_ID | VARCHAR2(5) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | TESTING_LAB_NAME | VARCHAR2(50) | Yes |  |  |
| 4 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 5 | ADDRESS_ID | NUMBER(6) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | CLIA_NUMBER | VARCHAR2(15) | Yes |  |  |
| 10 | MEDICAL_DIRECTOR | VARCHAR2(500) | Yes |  |  |

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
