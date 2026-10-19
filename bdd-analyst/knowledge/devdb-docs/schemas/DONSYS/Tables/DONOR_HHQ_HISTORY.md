---
tags:
  - table
  - DONSYS
---
# DONOR_HHQ_HISTORY

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9125
**Last Analyzed**: 2025-11-14 04:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 3 | CALC_AF_QTYPE | VARCHAR2(1) | Yes |  |  |
| 4 | ACTUAL_AF_QTYPE | VARCHAR2(1) | Yes |  |  |
| 5 | RESET_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | COMMENTS | VARCHAR2(500) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | ONLINE_ID | VARCHAR2(15) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_HHQ_HISTORY_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| DONOR_HHQ_HISTORY_INDX1 | NORMAL | NONUNIQUE | DONOR_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_QUESTIONNAIRE_HISTORY_BI|DONOR_QUESTIONNAIRE_HISTORY_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
