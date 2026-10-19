---
tags:
  - package
  - SRVSYS
---
# PRODUCT_CHECKIN

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
package product_checkin is

/*****************************************************************************
Developed By :
Create Date  :
Purpose      :
Date Mod     :
Version      : 01
Date Mod     : 04.18.2011
Version      : 02      by: Hussein; replace user by lt_session_user.get_userid
             : 03 - Modified by Kishore on 04/15/2011. SCR 18047
             : 04 - Modified by Kishore on 07/01/2015. Added code to display debug
                    messages based on a value in the DEBUG_CONTROLS tale.
             : 05 - Seshu 05/11/2016 -- Renamed Below tables for merging database work
              DRIVES	as	DRIVES_LAB
             : 06 -- valid_interdictions to valid_interdictions_lab table
               07  -- MLT- 3396 by Edwin

**************************************************************************** */




     procedure get_inventory_class (p_unit_id in varchar2,
                                     p_coll_date in date,
                                     p_chapter_id in varchar2,
                                     p_product_code in varchar2,
                                     p_aliquot in varchar2,
                                     p_update_prd_category in varchar2,
                                     p_blood_type in varchar2,
                                       p_code_scheme in varchar2,
                                     p_inven_class in out varchar2,
                                     p_storage_class in out varchar2);
      procedure product_antigen_categories;
      procedure product_rarity;
      procedure generate_location_id (p_product_code in varchar2,
                                      p_blood_type in varchar2,
                                      p_chapter_id in varchar2,
                                      p_storage_class in varchar2,
                                      p_tray_no in varchar2,
                                      p_location_id out varchar2);
      procedure auto_interface (p_types varchar2,
                                p_from  date,
                                p_to    date);
end product_checkin;
```
