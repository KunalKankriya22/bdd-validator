---
tags:
  - table
  - DONSYS
---
# HEALTH_HISTORY

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 135618
**Last Analyzed**: 2025-11-14 04:00:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 4 | ANSWER_CODE | VARCHAR2(5) | No |  |  |
| 5 | RESPONSE | VARCHAR2(1) | No |  |  |
| 6 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 7 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | DEFERRAL_PERIOD | NUMBER(4) | Yes |  |  |
| 9 | PERIOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 10 | INCIDENT_DATE | DATE | Yes |  |  |
| 11 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 12 | DEF_THRU_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | DONOR_RESP_LANG | VARCHAR2(2) | Yes |  |  |
| 18 | GROUP_CODE | VARCHAR2(30) | Yes |  |  |
| 19 | START_DATE | DATE | Yes |  |  |
| 20 | END_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DONAT_HEALTH_HIST_FK | TRANSACTION_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DONATIONS\|DONSYS.DONATIONS]] (TRANSACTION_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HEALTH_HISTORY_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| HEALTH_HISTORY_IDX2 | NORMAL | NONUNIQUE | TRANSACTION_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/HEALTH_HISTORY_BD|HEALTH_HISTORY_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/HEALTH_HISTORY_BI|HEALTH_HISTORY_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/HEALTH_HISTORY_BU|HEALTH_HISTORY_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| GENBDR | PACKAGE | DONSYS |
