---
tags:
  - package
  - LTAPI
---
# TUBE_CHECKIN_API

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE       TUBE_CHECKIN_API IS

/* ************************************************************
  This is Tube checkin interface: The API_TUBE_CHECKIN table is populated. This
  interface reads the data from the API table and uploads into the LT tables.
  After the data has been processed they are archived into the
   API_TUBE_CHECKIN_ARCH table

   Note: The profile set ID is stored in the contract ID field in the
         API table, so we take the value and finding out the contract ID
         field - as per LT 2018 R2 changes

  Created By        : Basker Edwin
  Date Of Creation  : 09/20/2011
  Version           : 01
                      02 [10/17/11] IM: 5983
                      03 [10/20/11] IM : 5995, 5996, 5997 [Edwin]
                      04 [10/24/11] scheduling profile tests
                      05 [10/31/11] not logging all the batches
                      06 [02/03/12] remove validation from Isbt start date
                      07 [02/28/12] Time zone changes
                      08 [03/02/12] IM: 7207  [Edwin]
                      09 [03/13/12] IM: 7566  [Edwin]
                      10 [03/19/12] IM: 7637  [Edwin]
                      11 [07/30/15] SCR# 20274, 20358 [Edwin]
                      12 [08/13/15] IM:67   Edwin
                      13 [09/01/15] IM: 94 (same logic as RGITUBES)
                      14 [09/09/15] rolling back the ver 13 (same as ver 12)
                      15 [10/19/15] IM: 146 (strip off codabar start/stop codes
                                    IM: 145 - populating chapter_id to
                                              lifetrak_api_log table


                    ----  Resetting the Version number for 2018---

                     01  [10/10/2017]
                     02  LT_2018_R2    Edwin
                     03  LT_2018_R2  -MLT360
                     04  LT_2018_R2  - For adding 4th tube checkin logic
                                       under R2 flag
                     05  LT_2018_R2  - adding the test_chapter_id MLT-596
                     06  LT_2018_R2  - update_holding_data MLT-623
                     07  LT_2018_R2_SP5_hotfix   MLT 3337     [06012020]
                     08  LT_2018_R2_SP5_hotfix [090220] - continuation of ver 07 (fine tuning )
                     09  2022_R2      - Auto QC MLT -5088
                     10  2022_R2 System testing issue (MLT-5143)

  *****************************************   */




 procedure main_proc(inp_file_name in varchar2,v_inst_id in varchar2);
 Procedure insert_units (pl_contract_id in varchar2,
                        pl_os_unit_id in varchar2,
                        pl_unit_id    in varchar2 ,
                        pl_red_tube   in varchar2,
                        pl_p1_tube    in varchar2,
                        pl_p2_tube    in varchar2,
                        pl_red_tube_2 in varchar2,
                        pl_coll_date in date,
                        pl_status out varchar2) ;

 Procedure insert_tubes (pl_int_unit_id  in varchar2,
                        pl_os_unit_id   in varchar2,
                        pl_unit_red     in varchar2,
                        pl_unit_p1      in varchar2,
                        pl_unit_p2      in varchar2,
                        pl_unit_red_2   in varchar2,
                        pl_status       out varchar2);

 Procedure update_holding_data (pl_int_unit_id in varchar2,
                                pl_coll_date in date,
                                pl_out_status out varchar2);

 Procedure insert_utrs (pl_int_unit_id in varchar2,
                        pl_out_unit_id in varchar2,
                        pl_coll_date   in date,
                        pl_status out varchar2);
Procedure insert_batch(pl_recv_date   in date,
                       pl_prof_seq_no in varchar2,
                       pl_status      out varchar2) ;
  procedure init_variables(pl_contract_id in varchar2,pl_message out varchar2);
  procedure gen_batch_id (pl_batch_id out varchar2);
  PROCEDURE VALIDATE_UNIT_CHKDIGIT (P_unit_id IN Varchar2,
                                    p_chk_digit OUT Varchar2 );
  Procedure validate_ext_unit(pl_os_tube        in varchar2,
                              pl_final_os_unit  out varchar2,
                              pl_out_status     out varchar2);

Procedure validate_int_unit_format(pl_in_unit     in   varchar2,
                                   pl_tube_type   in   varchar2,
                                   pl_out_unit_id out  varchar2,
                                   pl_status      out varchar2);

  procedure rollback_and_exit (p_msg in varchar2) ;
  PROCEDURE add_log_entry(p_log_text  in  varchar2,
                          p_ext_batch in  varchar2,
                          p_int_batch in  varchar2);

  Procedure verify_tube_consistency(pl_r in varchar2,
                                  pl_p1 in varchar2,
                                  pl_P2 in varchar2,
                                  pl_r2 in varchar2,
                                  pl_out_status out varchar2);

 procedure populate_archive ( pl_out_status out varchar2 );


  contCount              NUMBER:=0;
  p_message              VARCHAR2(150);
  g_contract_id          VARCHAR2(15);
  g_profile_set_id       VARCHAR2(20);
  g_chapter_id           VARCHAR2(4);
  g_batch_id             VARCHAR2(15);
  g_local_sysdate        DATE;
  g_con_bar_code         varchar2(1);
  g_copy_flag            varchar2(1);
  g_center_id            varchar2(10);
  g_profile_seq_no       number(6);
  g_company              varchar2(100);
  p_coll_date            DATE;
  p_recv_date            DATE;
  g_copy_isbt            varchar2(1);
  g_ext_batch_id         VARCHAR2(30);
end TUBE_CHECKIN_API;
```
