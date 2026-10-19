---
tags:
  - table
  - DONSYS
---
# DONOR_ATTRIBUTES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:11:00
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ATTRIB_CODE | VARCHAR2(5) | No |  |  |
| 4 | ATTRIB_VALUE | VARCHAR2(25) | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_ATTRIBUTES_IDX1 | NORMAL | NONUNIQUE | DONOR_ID, CHAPTER_ID, ATTRIB_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_ATTRIBUTES_BD|DONOR_ATTRIBUTES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_ATTRIBUTES_BI|DONOR_ATTRIBUTES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_ATTRIBUTES_BU|DONOR_ATTRIBUTES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
