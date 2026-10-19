---
tags:
  - table
  - SBCSYS
---
# VALID_ATTRIBUTE_CONFIG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 182
**Last Analyzed**: 2026-05-24 15:07:49
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 3 | ATTRIB_CLASS | VARCHAR2(5) | Yes |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | ATTRIB_MODIFIER | VARCHAR2(5) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | MODIFIED_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_BY | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | FCN_NAME | VARCHAR2(30) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_ATTRIBUTE_CONFIG_BD|VALID_ATTRIBUTE_CONFIG_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_ATTRIBUTE_CONFIG_BI|VALID_ATTRIBUTE_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_ATTRIBUTE_CONFIG_BU|VALID_ATTRIBUTE_CONFIG_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
