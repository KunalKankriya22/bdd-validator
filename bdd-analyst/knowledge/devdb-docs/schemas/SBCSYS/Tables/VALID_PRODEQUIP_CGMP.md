---
tags:
  - table
  - SBCSYS
---
# VALID_PRODEQUIP_CGMP

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 576
**Last Analyzed**: 2025-09-16 03:16:00
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EQUIP_TYPE | VARCHAR2(4) | Yes |  |  |
| 2 | PROC | VARCHAR2(2) | Yes |  |  |
| 3 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 4 | PARM_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | ACCEPT_MIN | NUMBER | Yes |  |  |
| 6 | ACCEPT_MAX | NUMBER | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFY_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 12 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_PRODEQUIP_CGMP_BD|VALID_PRODEQUIP_CGMP_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_PRODEQUIP_CGMP_IU|VALID_PRODEQUIP_CGMP_IU]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
