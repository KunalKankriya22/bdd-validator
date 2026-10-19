---
tags:
  - table
  - DONSYS
---
# DONOR_DISTRIBUTION_WEIGHTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 26
**Last Analyzed**: 2025-09-16 03:11:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ALPHA_CODE | VARCHAR2(2) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | WEIGHT | NUMBER(7,4) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**DONOR_DISTRIBUTION_WEIGHTS_PK**: `ALPHA_CODE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_DISTRIBUTION_WEIGHTS_PK | NORMAL | UNIQUE | ALPHA_CODE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_DISTRIBUTION_WEIGHTS_BD|DONOR_DISTRIBUTION_WEIGHTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_DISTRIBUTION_WEIGHTS_BI|DONOR_DISTRIBUTION_WEIGHTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
