---
tags:
  - table
  - DONSYS
---
# HLA_INTERIM_MATCH

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 569
**Last Analyzed**: 2026-05-22 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MATCH_A1A1 | VARCHAR2(1) | No |  |  |
| 2 | MATCH_A1A2 | VARCHAR2(1) | No |  |  |
| 3 | MATCH_A2A1 | VARCHAR2(1) | No |  |  |
| 4 | MATCH_A2A2 | VARCHAR2(1) | No |  |  |
| 5 | OUTPUT_A1 | VARCHAR2(1) | Yes |  |  |
| 6 | OUTPUT_A2 | VARCHAR2(1) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| HLA_INTERIM_MATCH_U1 | MATCH_A1A1, MATCH_A1A2, MATCH_A2A1, MATCH_A2A2 | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HLA_INTERIM_MATCH_U1 | NORMAL | UNIQUE | MATCH_A1A1, MATCH_A1A2, MATCH_A2A1, MATCH_A2A2 | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
