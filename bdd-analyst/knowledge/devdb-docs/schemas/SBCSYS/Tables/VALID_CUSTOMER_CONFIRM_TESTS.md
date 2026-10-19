---
tags:
  - table
  - SBCSYS
---
# VALID_CUSTOMER_CONFIRM_TESTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 43
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 2 | REACTIVE_TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | REACTIVE_TEST_RESULT | VARCHAR2(4) | No |  |  |
| 4 | REACTIVE_PLATE_SEQ | VARCHAR2(1) | No |  |  |
| 5 | CONFIRM_TEST_ID | VARCHAR2(10) | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_CUSTMR_CNFRM_TSTS_BD|VALID_CUSTMR_CNFRM_TSTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_CUSTMR_CNFRM_TSTS_BI|VALID_CUSTMR_CNFRM_TSTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_CUSTMR_CNFRM_TSTS_BU|VALID_CUSTMR_CNFRM_TSTS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_CUSTOMER_CNFRM_TESTS_BI|VALID_CUSTOMER_CNFRM_TESTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
