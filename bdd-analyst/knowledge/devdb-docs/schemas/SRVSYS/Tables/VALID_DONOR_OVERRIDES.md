---
tags:
  - table
  - SRVSYS
---
# VALID_DONOR_OVERRIDES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 44
**Last Analyzed**: 2026-04-17 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 2 | DONOR_DECISION_CODE | VARCHAR2(1) | No |  |  |
| 3 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | INTER_CODE | VARCHAR2(4) | No |  |  |
| 6 | INTER_TYPE | VARCHAR2(1) | No |  |  |
| 7 | OVERRIDE_DESC | VARCHAR2(50) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_DONOR_OVERRIDES_IDX1 | NORMAL | UNIQUE | PRODUCT_TYPE, DONOR_DECISION_CODE, ATTRIB_GROUP, ATTRIB_CODE, INTER_CODE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VALID_DONOR_OVERRIDES_BD|VALID_DONOR_OVERRIDES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VALID_DONOR_OVERRIDES_BI|VALID_DONOR_OVERRIDES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VALID_DONOR_OVERRIDES_BU|VALID_DONOR_OVERRIDES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
