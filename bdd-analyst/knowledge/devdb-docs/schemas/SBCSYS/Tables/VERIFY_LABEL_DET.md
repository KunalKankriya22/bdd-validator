---
tags:
  - table
  - SBCSYS
---
# VERIFY_LABEL_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1735
**Last Analyzed**: 2025-09-16 03:16:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LABEL_SEQ_NO | NUMBER(4) | Yes |  |  |
| 2 | LABEL_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | LABEL_VALUE | VARCHAR2(12) | Yes |  |  |
| 4 | LABEL_INTER | VARCHAR2(50) | Yes |  |  |
| 5 | VERIFICATION_NO | VARCHAR2(12) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
