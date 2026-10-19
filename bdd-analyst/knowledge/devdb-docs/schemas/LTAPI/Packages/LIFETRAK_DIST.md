---
tags:
  - package
  - LTAPI
---
# LIFETRAK_DIST

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE         "LIFETRAK_DIST" IS

  function local_time_zone(i_chapter_id in varchar2) return date;

  Procedure GET_ORDER_NO(i_chapter_id in varchar2,
			 i_order_no out varchar2,
			 p_status out varchar2);

  Procedure GET_PROD_PRICE(i_chapter_id in varchar2,
			   i_prd_type   in varchar2,
			   i_tier       in varchar2,
			   i_cust_id    in varchar2,
			   i_prod_price out number,
			   p_status     out varchar2);

  Procedure GENERATE_NOTES (p_notes in varchar2,
			    p_out_note_id out varchar2,
			    p_status    out varchar2);
   PROCEDURE POPULATE_ORDER_ITEMS(
	   		     i_order_no       in varchar2,
			     i_chapter_id     in varchar2,
			     i_item_no        in number,
			     i_prod_type      in varchar2,
			     i_abo_value      in varchar2,
			     i_tier_code      in varchar2,
			     i_item_status    in varchar2,
			     i_req_qty        in number,
			     i_allo_qty       in number,
			     i_ship_qty       in number,
			     i_sys_can_qty    in number,
			     i_sub_flag       in varchar2,
			     i_unit_price     in number,
			     i_cancel_qty     in number,
			     i_item_note_id   in varchar2,
			     i_sub_qty        in number,
			     i_prog_id        in varchar2,
			     p_status         out varchar2);

 PROCEDURE POPULATE_ORDERS( i_order_no    in varchar2,
			   i_chapter_id  in varchar2,
			   i_ord_type    in varchar2,
		           i_customer_id in varchar2,
			   i_cons_id     in varchar2,
			   i_payee_id    in varchar2,
		           i_ord_status  in varchar2,
			   i_ord_class   in varchar2 ,
			   i_insert_date in date,
		           i_insert_user in varchar2,
			   i_last_date   in date,
			   i_contract_id in varchar2,
			   i_order_by    in varchar2,
		           i_cod_flag    in varchar2,
			   i_est_time    in date,
			   i_f_ship_date in date,
		           i_note_id     in number,
			   i_stdng_ord   in varchar2,
		           i_ord_mode    in varchar2,
			   i_prog_id     in varchar2,
			   p_status      out varchar2);

PROCEDURE POPULATE_ORDER_ITEM_ATTRS(
                                   i_order_no        in varchar2,
  		                   i_chapter_id      in varchar2,
				   i_item_no         in number,
				   i_attrib_group    in varchar2,
                                   i_attr_code       in varchar2,
				   i_unit_price      in number,
                                   i_prod_type       in varchar2,
                                   i_req_qty         in varchar2,
				   i_prog_id         in varchar2,
				   p_status          out varchar2) ;
  x_count   NUMBER:=0;
  p_ext_id               VARCHAR2(50);
  p_int_id               VARCHAR2(50);
  p_appl_name            VARCHAR2(20);
  p_err_msg              VARCHAR2(500);
END LIFETRAK_DIST;

```
