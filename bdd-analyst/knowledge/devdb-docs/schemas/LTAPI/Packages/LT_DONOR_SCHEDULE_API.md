---
tags:
  - package
  - LTAPI
---
# LT_DONOR_SCHEDULE_API

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- CHAPTERS (SYNONYM in PUBLIC)
- LIFETRAK_DONOR (PACKAGE in LTAPI)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE                           "LT_DONOR_SCHEDULE_API" IS

  procedure add_error_log(pl_data_src in varchar2,
                          pl_log_text in varchar2);

  PROCEDURE insert_comm (p_donor_id in varchar2,
                       	 p_com_type in varchar2,
                       	 p_com_desc in varchar2,
                       	 p_com_code in varchar2,
			       p_chapter_id in varchar2,
				 p_stat out varchar2);

  PROCEDURE update_slots (p_oper in varchar2,
                          p_start in date,
                          p_end in date,
			        p_site_id in varchar2,
				  p_donation_type in varchar2,
				  p_proc_code in varchar2,
				  p_chapter_id in varchar2,
				  p_stat out varchar2);

  PROCEDURE INSERT_INTO_FSS (p_site_id in varchar2,
				     p_sch_date in date,
				     p_donation_type in varchar2,
				     p_proc_code in varchar2,
				     p_chapter_id in varchar2,
				     p_sch_from_time in date);

  PROCEDURE add_update (szDrive_id in varchar2,
			      szslot_time in date,
			      p_stat out varchar2);

  PROCEDURE delete_update (szDrive_id in varchar2,
				   szslot_time in date,
				   p_stat out varchar2);

  FUNCTION is_slots_available (szDrive_id in varchar2,
				       szslot_time in date,
				       p_stat out varchar2) RETURN BOOLEAN;

  PROCEDURE update_slots_table (szDrive_id in varchar2,
					  szslot_time in date,
					  operation in varchar2);

  procedure rollback_and_exit (pl_data_src in varchar2,
                               pl_err_msg in varchar2);

  function IS_LT_NUMBER_REQ (pl_id_type in varchar2) return char;

  procedure lifetrak_translation(p_source_id in varchar2,
                                 p_source_type in varchar2,
                                 p_source_value in varchar2,
                                 p_target_value out varchar2,
                                 pl_status out varchar2);

  PROCEDURE SCHEDULE_PROCESSOR(pl_os_appl_name in varchar2);

  p_ext_id               VARCHAR2(50);
  p_int_id               VARCHAR2(50);
  p_appl_name            VARCHAR2(20);
  p_err_msg              VARCHAR2(500);
  v_tb_id                VARCHAR2(64);
  v_chapter_id           VARCHAR2(5);
  x_lt_order_no          VARCHAR2(15);
  g_action_id            VARCHAR2(5);
  lt_order_status        varchar2(5);
  pl_source_id           varchar2(30);
  p_status               varchar2(200);
  nConvCount             NUMBER:=0;
  szExtApplID            VARCHAR2(20);
  szXferValue            VARCHAR2(50);
  szXferStatus           VARCHAR2(100);
  nValid                 NUMBER:=0;

  TYPE type_param_tbl is table of varchar2(100) index by binary_integer;
  ar  LIFETRAK_DONOR.type_param_tbl;

  procedure insert_api_conv(P_EXT_TEMP_ID      in varchar2,
                            P_LIFETRAK_PERM_ID in varchar2,
                            P_ID_TYPE          in varchar2,
                            p_TEMP_AUDIT_KEY   in number,
                            P_PERM_AUDIT_KEY   in number,
                            P_SOURCE_ID        in varchar2,
                            P_INSERT_DATE      in date,
                            p_stat             out varchar2);

  g_chapter_id      chapters.chapter_id%type; -- Added by Kishore on 01/19/2012
  g_sysdate         date; -- Added by Kishore on 01/19/2012
END LT_DONOR_SCHEDULE_API;
```
