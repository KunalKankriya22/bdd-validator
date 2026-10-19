---
tags:
  - table
  - DONSYS
---
# VALID_TERRITORIES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 134
**Last Analyzed**: 2026-04-09 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TERRITORY_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TERRITORY_NAME | VARCHAR2(150) | No |  |  |
| 4 | TERRITORY_GROUP | VARCHAR2(5) | No |  |  |
| 5 | TERRITORY_TYPE | VARCHAR2(5) | No |  |  |
| 6 | TERRITORY_SHORT_NAME | VARCHAR2(10) | Yes |  |  |
| 7 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_TERRITORIES_PK**: `TERRITORY_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_TERRITORIES_PK | NORMAL | UNIQUE | TERRITORY_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_TERRITORIES_BD|VALID_TERRITORIES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_TERRITORIES_BI|VALID_TERRITORIES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_TERRITORIES_BU|VALID_TERRITORIES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
