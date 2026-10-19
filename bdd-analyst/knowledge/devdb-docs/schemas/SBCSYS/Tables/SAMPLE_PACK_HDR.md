---
tags:
  - table
  - SBCSYS
---
# SAMPLE_PACK_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 175
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PACK_DATE | DATE | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | DONOR_TYPE | VARCHAR2(1) | No |  |  |
| 6 | EXTRACT_TYPE | VARCHAR2(1) | No |  |  |
| 7 | STATUS | VARCHAR2(1) | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 10 | DESTINATION_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | BOX_CLOSED_DATE | DATE | Yes |  |  |
| 12 | BOX_CLOSED_USER | VARCHAR2(6) | Yes |  |  |

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
