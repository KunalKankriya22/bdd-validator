---
tags:
  - table
  - SBCSYS
---
# COMPONENT_SP_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 916
**Last Analyzed**: 2025-09-20 03:00:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | COMPONENT_PREFIX | VARCHAR2(2) | Yes |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 6 | PROCESS_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | INSERT_DATS | DATE | Yes |  |  |
| 8 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 9 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 10 | PATIENT_ID | VARCHAR2(11) | Yes |  |  |
| 11 | LINK_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 15 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_SP_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
