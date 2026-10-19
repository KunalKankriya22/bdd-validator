---
tags:
  - table
  - SBCSYS
---
# BC_SPATR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 37
**Last Analyzed**: 2025-09-16 03:14:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | PRODTYPE | VARCHAR2(5) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 5 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 6 | INSERT_DATS | DATE | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**BC_SPATR_PK**: `UNIT_ID, PRODTYPE, CHAPTER_ID, ATTRIB_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| BC_SPATR_PK | NORMAL | UNIQUE | UNIT_ID, PRODTYPE, CHAPTER_ID, ATTRIB_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/BC_SPATR_BI|BC_SPATR_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
