---
tags:
  - view
  - SRVSYS
---
# VSERV_CANCEL_CODES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Text Length**: 119 chars

## Referenced Tables

- [[schemas/SRVSYS/Tables/VSERV_MASTER|SRVSYS.VSERV_MASTER]]

## Definition

```sql
select code cancel_code, code_desc,eff_date,term_date,
 last_modified_date from vserv_master where code_type = 'CANCL'

```
