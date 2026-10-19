---
tags:
  - view
  - UTIL
---
# USER_MENU

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Text Length**: 1177 chars

## Referenced Tables

- [[schemas/UTIL/Tables/MENU_ITEM|UTIL.MENU_ITEM]]

## Definition

```sql
select
	mi.appl_id,
	mi.fcn_id,
	mi.menu_id,
	mi.descrip,
	mi.sequence,
	mi.acc_lvl,
	mi.p1_value,
	mi.p2_value,
	mi.p3_value,
	mi.mnemonic,
	mi.item_hide,
	fcn.fcn_type,
	fcn.exec_name,
	fcn.host_cmd,
	fcn.p1_name,
	fcn.p2_name,
	fcn.p3_name,
	nvl(mi.remarks,fcn.remarks) remarks,
	fgp.user_id
from
	menu_item mi ,
	menu_item mmi ,
	fcn ,
	fcn_grp_priv fgp
where fcn.fcn_id = mi.fcn_id and
	fcn.appl_id = mi.appl_id and
	mmi.appl_id (+)  = mi.appl_id and
	mmi.fcn_id (+) = mi.menu_id and
	fgp.appl_id = mi.appl_id and
	nvl(substr(mi.acc_lvl,
                       to_number(substr(fgp.grp_id,4,2))+1,
                       1),'9') <= to_char(fgp.acc_priv) and
	substr(mi.acc_lvl,
		to_number(substr(fgp.grp_id,4,2))+1,1) not in ('0',' ') and
	fgp.user_id = lt_user_session.get_userid and
	nvl(mi.item_hide,'N') !='Y' and
	to_char(fgp.acc_priv) >=
	(select nvl(max(to_number(nvl(decode(
		substr(pi.acc_lvl, to_number(substr(fgp.grp_id,4,2))+1,1),
		' ','10','0','10',
		substr(pi.acc_lvl, to_number(substr(fgp.grp_id,4,2))+1,1)),'10'))),1)
     from menu_item pi
	 where pi.appl_id = mi.appl_id
	 connect by pi.fcn_id = prior menu_id
	 start with pi.mnemonic = mmi.mnemonic)
```
