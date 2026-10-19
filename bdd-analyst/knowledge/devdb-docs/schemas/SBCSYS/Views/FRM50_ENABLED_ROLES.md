---
tags:
  - view
  - SBCSYS
---
# FRM50_ENABLED_ROLES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Text Length**: 301 chars

## Definition

```sql
select urp.granted_role role,
sum(distinct decode(rrp.granted_role,
   'ORAFORMS$OSC',2,
   'ORAFORMS$BGM',4,
   'ORAFORMS$DBG',1,0)) flag
from  sys.user_role_privs urp, role_role_privs rrp
where urp.granted_role = rrp.role (+)
  and urp.granted_role not like 'ORAFORMS$%'
group by urp.granted_role

 
```
