---
tags:
  - view
  - SRVSYS
---
# VSERV_CUSTOMER_TYPE

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Text Length**: 111 chars

## Referenced Tables

- [[schemas/SRVSYS/Tables/VSERV_MASTER|SRVSYS.VSERV_MASTER]]

## Definition

```sql
select CODE, CODE_DESC, EFF_DATE, TERM_DATE, LAST_MODIFIED_DATE
		from VSERV_MASTER
		where CODE_TYPE = 'CUST'

```
