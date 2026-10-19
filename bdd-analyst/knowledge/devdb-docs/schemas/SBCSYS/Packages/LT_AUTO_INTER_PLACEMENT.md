---
tags:
  - package
  - SBCSYS
---
# LT_AUTO_INTER_PLACEMENT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "LT_AUTO_INTER_PLACEMENT" IS

/* ************************************************************
  This Package would be used to place the interdiction automatically based on
   the auto interdiction table configuration

  Created By        : Basker Edwin
  Date Of Creation  : 03/25/2013
  Compatability     : LT_2013 and above

  Version   : 01 [03/25/13] - Edwin
  Version   : 02 [04/23/13] - Ashok - Modified pl_status variable to be
                                      'OK' instead of 'Ok'.
  Version   : 03 [05/15/13]  -Edwin (IM: 9386)

  Version   : 04 (11/04/13)  - Edwin (IM:9770)

  Version   : 05 (12/13/13)    - Edwin (IM: 9841)

  Version   : 06 (12/26/13)  - Edwin (IM: 9853)

 Restarting Version to 01 for LT 2018

  Version   : 01 - LT2018-valid_interdictions to valid_interdictions_lab table.
  Verion    : 02 - For IM: 328 , Edwin - 10/18/16

  *****************************************   */


 procedure main_proc(pl_function_name   in varchar2,
                    pl_function_type    in varchar2,
                    pl_action_code      in varchar2,
                    pl_chapter_id       in varchar2,
                    pl_unit_id          in varchar2,
                    pl_coll_date        in date,
                    pl_source_prod_code in varchar2,
                    pl_status           out varchar2);

  procedure init_variables;

Procedure find_action_product(x_function_name in varchar2,
                             x_unit_id in varchar2,
                             x_coll_date in date,
                             x_chapter_id  in varchar2,
                             x_source_prod_code in varchar2,
                             x_action_product out varchar2,
                             x_inter_code out varchar2,
                             x_status out varchar2);

Procedure find_action_prod_from_types(x_function_name       in varchar2,
                                      x_unit_id             in varchar2,
                                      x_coll_date           in date,
                                      x_chapter_id          in varchar2,
                                      x_source_product_code in varchar2,
                                      x_action_product      out varchar2,
                                      x_inter_code          out varchar2,
                                      x_status              out varchar2);


Procedure place_inter_on_other_prods(x_unit_id in varchar2,
                                      x_coll_date in date,
                                      x_chapter in varchar2,
                                      x_source_prod in varchar2,
                                      x_prod_list in varchar2,
                                      x_inter in varchar2,
                                      x_status out varchar2) ;

Procedure place_inter_on_other_types(x_unit_id in varchar2,
                                      x_coll_date in date,
                                      x_chapter in varchar2,
                                      x_source_prod in varchar2,
                                      x_prod_type_list in varchar2,
                                      x_inter in varchar2,
                                      x_status out varchar2);

Function place_comp_interdiction (p_unit_id             in   varchar2,
                                 p_coll_date            in   date,
                                 p_chapter_id           in   varchar2,
                                 p_product_code         in   varchar2,
                                 p_inter_code           in   varchar2,
                                 p_user_id              in   varchar2,
                                 p_prog_name            in   varchar2)
          return varchar2;

Function place_unit_interdiction (p_unit_id              in   varchar2,
                                  p_coll_date            in   date,
			          p_chapter_id           in   varchar2,
			          p_inter_code           in   varchar2,
			          p_user_id              in   varchar2,
			          p_prog_name            in   varchar2)
	  return varchar2;

  p_chp_sys_date         DATE;

end LT_AUTO_INTER_PLACEMENT;

```
