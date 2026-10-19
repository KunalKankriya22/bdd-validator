---
tags:
  - table
  - DONSYS
---
# VALID_ATTRIBUTES_DON

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 58
**Last Analyzed**: 2026-05-07 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ATTRIB_CODE | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_TABLE | VARCHAR2(30) | No |  |  |
| 3 | REQUIRED | VARCHAR2(1) | No |  |  |
| 4 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 5 | ATTRIB_DESC | VARCHAR2(50) | Yes |  |  |
| 6 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 7 | VALID_CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | DEFAULT_VALUE | VARCHAR2(10) | Yes |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_ATTRIBUTES_PK**: `ATTRIB_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ATTRIBUTES_PK | NORMAL | UNIQUE | ATTRIB_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_ATTRIBUTES_DON_BD|VALID_ATTRIBUTES_DON_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ATTRIBUTES_DON_BI|VALID_ATTRIBUTES_DON_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ATTRIBUTES_DON_BU|VALID_ATTRIBUTES_DON_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
