---
module: Donor
sub_module: "User & System Utilities"
title: "utqckacc"
mnemonic: utqckacc
tags:
  - screen
  - donor
  - user-and-system-utilities
---

# utqckacc — utqckacc

**Module:** [[Donor]] > [[User & System Utilities]]

## Database Tables

- [[(select mi.mnemonic mnemonic]]
- [[mi.descrip descrip]]
- [[fcn.exec_name exec_name]]
- [[fgp.user_id user_id from menu_item mi]]
- [[menu_item mmi]]
- [[fcn]]
- [[fcn_grp_priv fgp where fcn.fcn_id = mi.fcn_id and fcn.appl_id = mi.appl_id and mmi.appl_id (+) = mi.appl_id and mmi.fcn_id (+) = mi.menu_id and fgp.appl_id = mi.appl_id and nvl(substr(mi.acc_lvl]]
- [[to_number(substr(fgp.grp_id]]
- [[2))+1]]
- [[1)]]
- [['9') &lt;= to_char(fgp.acc_priv) and substr(mi.acc_lvl]]
- [[to_number(substr(fgp.grp_id]]
- [[2))+1]]
- [[1) not in ('0']]
- [[' ') and nvl(mi.item_hide]]
- [['N') !='Y' and to_char(fgp.acc_priv) >= (select nvl(max(to_number(nvl(decode( substr(pi.acc_lvl]]
- [[to_number(substr(fgp.grp_id]]
- [[2))+1]]
- [[1)]]
- [[' ']]
- [['10']]
- [['0']]
- [['10')]]
- [[substr(pi.acc_lvl]]
- [[to_number(substr(fgp.grp_id]]
- [[2))+1]]
- [[1))))]]
- [['10') from menu_item pi where pi.appl_id = mi.appl_id connect by pi.fcn_id = prior menu_id start with pi.mnemonic = mmi.mnemonic)) T]]
- [[&amp;#10;       &amp;#10;      select &amp;#10;        fgp.user_id user_id]]
- [[fgp.grp_id grp_id]]
- [[fgp.acc_priv acc_priv]]
- [[mi.mnemonic mnemonic&amp;#10;from&amp;#10;        menu_item mi]]
- [[&amp;#10;        menu_item mmi]]
- [[&amp;#10;        fcn]]
- [[&amp;#10;        fcn_grp_priv fgp&amp;#10;where fcn.fcn_id = mi.fcn_id and&amp;#10;        fcn.appl_id = mi.appl_id and&amp;#10;        mmi.appl_id (+)  = mi.appl_id and&amp;#10;        mmi.fcn_id (+) = mi.menu_id and&amp;#10;        fgp.appl_id = mi.appl_id and&amp;#10;        nvl(substr(mi.acc_lvl]]
- [[&amp;#10;                       to_number(substr(fgp.grp_id]]
- [[2))+1]]
- [[&amp;#10;                       1)]]
- [['9') &lt;= to_char(fgp.acc_priv) and&amp;#10;        substr(mi.acc_lvl]]
- [[&amp;#10;                to_number(substr(fgp.grp_id]]
- [[2))+1]]
- [[1) not in ('0']]
- [[' ') &amp;#10;         and&amp;#10;        nvl(mi.item_hide]]
- [['N') !='Y' and&amp;#10;        to_char(fgp.acc_priv) >=&amp;#10;        (select nvl(max(to_number(nvl(decode(&amp;#10;                substr(pi.acc_lvl]]
- [[to_number(substr(fgp.grp_id]]
- [[2))+1]]
- [[1)]]
- [[&amp;#10;                ' ']]
- [['10']]
- [['0']]
- [['10')]]
- [[&amp;#10;                substr(pi.acc_lvl]]
- [[to_number(substr(fgp.grp_id]]
- [[2))+1]]
- [[1))))]]
- [['10')&amp;#10;     from menu_item pi&amp;#10;         where pi.appl_id = mi.appl_id&amp;#10;         connect by pi.fcn_id = prior menu_id&amp;#10;         start with pi.mnemonic = mmi.mnemonic)&amp;#10;]]
- [[FCN_GRP_PRIV]]
- [[menu_item]]
- [[VALID_ACL_CODES]]
- [[VALID_USER_ACCESS_CLASSES]]

## Dropdown/LOV Sources
Values in dropdowns on this screen come from:

- [[SYSTEM_USERS]]
