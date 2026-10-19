---
tags:
  - table
  - SRVSYS
---
# VSERV_RETURN_REASONS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 178
**Last Analyzed**: 2026-04-17 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CODE | VARCHAR2(5) | Yes |  |  |
| 3 | CODE_DESC | VARCHAR2(50) | Yes |  |  |
| 4 | LOCATION_TYPE | VARCHAR2(2) | Yes |  |  |
| 5 | CR_NCR | VARCHAR2(1) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | ENFORCE | VARCHAR2(1) | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_INSERT_DATE | DATE | No |  |  |
| 14 | FEE_CODE_1 | VARCHAR2(5) | Yes |  |  |
| 15 | FEE_CODE_2 | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_RETURN_REASONS_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
