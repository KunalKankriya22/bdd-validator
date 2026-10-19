---
tags:
  - package
  - SRVSYS
---
# SRVLIB

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
package srvlib is
/******************************************
Created By   : Edwin
Created On   : 01/01/2009
Purpose      : DIST application routines.
Modified Date: 03/07/09
Version      : 02 Ashok [12/11/2015] - SCR 177145 - moved number generation logic to db package. LT2015SP1
Version      : 03 Edwin [10/27/21] a new routine to calculatie the box id and ship number is added for plasma gel tube (2019_R4)

**************************************** */


        procedure update_inventory_levels ( p_product_type in varchar2,
											p_blood_type  in varchar2,
											p_chapter_id  in varchar2,
											p_customer_id in varchar2,
											p_inventory_class in varchar2,
											p_unit_id in varchar2,
											p_coll_date in date,
											p_add_del_flag in varchar2);
        procedure update_trays (p_location_id in varchar2,
                               p_chapter_id  in varchar2,
                               p_product_type in varchar2,
                               p_blood_type in varchar2,
                               p_add_del_flag in varchar2);
        -- SCR 177145 - gen_num procedure added.
        procedure gen_num(
                               p_pref 	 IN VARCHAR2  -- IN Preference
                              ,p_type 	 IN VARCHAR2  -- IN Type
                              ,p_chp_id  IN VARCHAR2  -- IN Chapter ID
                              ,p_num     OUT VARCHAR2 -- OUT Generated Number
                              ,p_err_msg OUT VARCHAR2 -- OUT Error Message
                            );
        -- SCR 177145
        procedure gen_num_id( p_pref 	 IN VARCHAR2  -- IN Preference
                              ,p_type 	 IN VARCHAR2  -- IN Type
                              ,p_chp_id  IN VARCHAR2  -- IN Chapter ID
                              ,p_num     OUT VARCHAR2 -- OUT Generated Number
                              ,p_err_msg OUT VARCHAR2 -- OUT Error Message
                            );
        -- SCR 177145
        procedure gen_num_box(p_chp_id   IN VARCHAR2  -- IN Chapter ID
                              ,p_num      OUT VARCHAR2 -- OUT Generated Number
                              ,p_err_msg  OUT VARCHAR2 -- OUT Error Message
                            );
        -- SCR 177145
        procedure gen_num_shipment(
                               p_class    IN VARCHAR2,  -- IN Class
                               p_chp_id   IN VARCHAR2   -- IN Chapter ID
                              ,p_num      OUT VARCHAR2  -- OUT Generated Number
                              ,p_err_msg  OUT VARCHAR2  -- OUT Error Message
                            ) ;

      PROCEDURE generate_geltube_ids (
                                  p_id_type    in varchar2,
                                  p_chapter_id  in varchar2,
                                  p_id_value  out varchar2,
                                  p_error_msg out varchar2);
end srvlib;
```
