---
tags:
  - table
  - DONSYS
---
# VALID_COMMUNICATION_CODES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 286
**Last Analyzed**: 2026-05-01 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | COMM_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | COMM_CODE | VARCHAR2(5) | No |  |  |
| 4 | DESCRIPTION | VARCHAR2(50) | No |  |  |
| 5 | TARGET_DAYS | NUMBER(4) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_COMMUNICATION_CODES_PK**: `COMM_TYPE, CHAPTER_ID, COMM_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_COMMUNICATION_CODES_PK | NORMAL | UNIQUE | COMM_TYPE, CHAPTER_ID, COMM_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_COMMUNICATION_CODES_BI|VALID_COMMUNICATION_CODES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
