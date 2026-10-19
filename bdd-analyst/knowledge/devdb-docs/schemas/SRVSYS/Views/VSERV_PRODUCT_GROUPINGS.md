---
tags:
  - view
  - SRVSYS
---
# VSERV_PRODUCT_GROUPINGS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Text Length**: 109 chars

## Referenced Tables

- [[schemas/SRVSYS/Tables/VSERV_MASTER|SRVSYS.VSERV_MASTER]]

## Definition

```sql
select code, code_desc, eff_date, term_date, last_modified_date
from  vserv_master
where code_type = 'PRDGP'

```
