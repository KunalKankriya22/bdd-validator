---
tags:
  - table
  - DONSYS
---
# VALID_ACL_CODES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2234
**Last Analyzed**: 2026-04-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ACCESS_CLASS | VARCHAR2(5) | No |  |  |
| 2 | ACCESS_CODE_TYPE | VARCHAR2(5) | No |  |  |
| 3 | ACCESS_CODE_VALUE | VARCHAR2(10) | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_ACL_CODES_PK**: `ACCESS_CLASS, ACCESS_CODE_TYPE, ACCESS_CODE_VALUE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ACL_CODES_PK | NORMAL | UNIQUE | ACCESS_CLASS, ACCESS_CODE_TYPE, ACCESS_CODE_VALUE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_ACL_CODES_BD|VALID_ACL_CODES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ACL_CODES_BI|VALID_ACL_CODES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ACL_CODES_BU|VALID_ACL_CODES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
