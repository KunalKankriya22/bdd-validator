---
tags:
  - table
  - DONSYS
---
# VALID_DONATION_TYPES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 235
**Last Analyzed**: 2026-05-16 15:07:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_NEEDED_FLAG | VARCHAR2(1) | No |  |  |
| 4 | DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 5 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 6 | DONATION_TYPE_GROUP | VARCHAR2(5) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_DONATION_TYPES_PK**: `DONATION_TYPE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_DONATION_TYPES_PK | NORMAL | UNIQUE | DONATION_TYPE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_DONATION_TYPES_BD|VALID_DONATION_TYPES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_DONATION_TYPES_BI|VALID_DONATION_TYPES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_DONATION_TYPES_BU|VALID_DONATION_TYPES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
