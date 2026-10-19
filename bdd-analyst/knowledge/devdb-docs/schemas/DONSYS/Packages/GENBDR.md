---
tags:
  - package
  - DONSYS
---
# GENBDR

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- [[schemas/DONSYS/Tables/CENTRAL_NOTES|CENTRAL_NOTES]] (TABLE)
- [[schemas/DONSYS/Tables/DONATIONS|DONATIONS]] (TABLE)
- [[schemas/DONSYS/Tables/DONATION_ATTRIBUTES|DONATION_ATTRIBUTES]] (TABLE)
- [[schemas/DONSYS/Tables/DONATION_EQUIP_SUPPLY_DET|DONATION_EQUIP_SUPPLY_DET]] (TABLE)
- [[schemas/DONSYS/Tables/DONATION_INTERDICTIONS|DONATION_INTERDICTIONS]] (TABLE)
- [[schemas/DONSYS/Tables/DONATION_TUBES|DONATION_TUBES]] (TABLE)
- [[schemas/DONSYS/Tables/DONORS|DONORS]] (TABLE)
- [[schemas/DONSYS/Tables/DONOR_ADDRESSES|DONOR_ADDRESSES]] (TABLE)
- [[schemas/DONSYS/Tables/DONOR_CONSENTS|DONOR_CONSENTS]] (TABLE)
- [[schemas/DONSYS/Tables/DONOR_INTERDICTIONS|DONOR_INTERDICTIONS]] (TABLE)
- [[schemas/DONSYS/Tables/HEALTH_HISTORY|HEALTH_HISTORY]] (TABLE)
- [[schemas/DONSYS/Tables/HEALTH_HISTORY_TEMPLATE|HEALTH_HISTORY_TEMPLATE]] (TABLE)
- [[schemas/DONSYS/Tables/MATERIAL_VERIFICATION_DET|MATERIAL_VERIFICATION_DET]] (TABLE)
- [[schemas/DONSYS/Tables/ONLINE_STATUS|ONLINE_STATUS]] (TABLE)
- [[schemas/DONSYS/Tables/PHYSICAL_FINDINGS|PHYSICAL_FINDINGS]] (TABLE)
- STANDARD (PACKAGE in SYS)
- [[schemas/DONSYS/Tables/VALID_CITY_STATE|VALID_CITY_STATE]] (TABLE)
- [[schemas/DONSYS/Tables/VALID_INTERDICTIONS|VALID_INTERDICTIONS]] (TABLE)
- [[schemas/DONSYS/Tables/VALID_LETTERS|VALID_LETTERS]] (TABLE)
- [[schemas/DONSYS/Tables/VALID_REGINT_REASONS|VALID_REGINT_REASONS]] (TABLE)

## Package Specification

```plsql
PACKAGE GENBDR as

  /* *********************************************************************************
    Name              : GENBDR.pkg
    Created By        : Basker Edwin
    Date Of Creation  : 12/10/2019
    Purpose           : Generating the BDR automatically .

    Version History (Change program version in code below)

    Date         Version   by     	Description
    ---------------------------------------------------------------------------------
    12/01/2019   01	B. Edwin 	Initial development
    01/14/202    02     B. Edwin        Added drive ID, credit sponsor, double stick arm codes
    01/22/2020   03     B. Edwin        MLT-2961
    01/27/2020   04     B. Edwin        MLT-2961  (Adding date to the donor comments)
    02/03/2020   05     B. Edwin        MLT-2996
    04/21/2020   06     B. Edwin        MLT- 3148
    05/12/2020   07     B. Edwin        MLT- 3291
    07/07/2020   08     B. Edwin        MLT-3454
    08/20/2020   09     B. Edwin        MLT-3558
    03/16/2021   10     B. Edwin        MLT-4143

     ***********************************************************************
  */


  procedure MAIN_PROGRAM(p_trans_id   in varchar2,
                         p_chapter_id in varchar2,
                         p_user_id    in varchar2,
                         p_status     out varchar2) ;

 --- Donor dempgraphic cursor

    cursor C1 (p_donor_id in varchar2 ) is select d.donor_id,
           d.last_name, d.first_name, d.middle_name, d.date_of_birth dob ,
           d.blood_type, d.gender,d.alternate_id_type, d.alternate_id,d.ETHNIC_GROUP ,
           da.street_name,decode(da.suite_apt,null,null,'APT# '||da.suite_apt) suiteapt,
           decode(h_area_code,null,null,h_area_code||'-'||substr(h_phone_no,1,3)||'-'||substr(h_phone_no,4)) HP,
           decode(d_area_code,null,null,d_area_code||'-'||substr(d_phone_no,1,3)||'-'||substr(d_phone_no,4)) DP,
           decode(m_area_code,null,null,m_area_code||'-'||substr(m_phone_no,1,3)||'-'||substr(m_phone_no,4)) MP,
           da.preferred_contact_flag, da.email,da.extension,da.INTL_ADDR_FLAG,
           vcs.city,vcs.state,vcs.zip from donors d, donor_addresses da,
           valid_city_state vcs where d.donor_id=p_donor_id and
          d.donor_id=da.donor_id and da.usps_id=vcs.usps_id;

 cursor C1A (p_donor_id in varchar2 ) is select d.donor_id,
           d.last_name, d.first_name, d.middle_name, d.date_of_birth dob ,
           d.blood_type, d.gender,d.alternate_id_type, d.alternate_id,d.ETHNIC_GROUP ,
           da.email,da.INTL_ADDRESS_1,da.INTL_ADDRESS_2,da.INTL_ADDRESS_3,da.COUNTRY_NAME,da.INTL_POSTAL_CODE,
           da.INTL_HOME_PHONE_NO,da.INTL_WORK_PHONE_NO,da.INTL_WORK_PHONE_EXT,da.INTL_MOBILE_PHONE_NO,
           da.INTL_FAX_NO,da.INTL_ADDR_FLAG,da.INTL_ADDRESS_4,da.INTL_CITY_NAME ,
           da.preferred_contact_flag from donors d, donor_addresses da
           where d.donor_id=p_donor_id and d.donor_id=da.donor_id;


   --- Getting the donations details

     cursor C2 (p_trans_id in varchar2 ) is select u.unit_id,
           u.deferral_id, u.coll_date, u.donation_type, u.procedure_code ,
           u.lot_number, u.catalog_number, u.arm_used,
           u.lookup_id, u.screener_id, u.physical_id,u.BLEED_START_TIME_L1,
           u.BLEED_START_TIME_L2, u.BLEED_START_TIME_R1,u.BLEED_START_TIME_R2,
           u.BLEED_END_TIME_R,u.BLEED_END_TIME_L, u.BLEED_END_TIME_L2 ,
           u.BLEED_END_TIME_R2,U.BLEED_START_PHLEB_L1,U.BLEED_START_PHLEB_L2,
           U.BLEED_START_PHLEB_R1,U.BLEED_START_PHLEB_R2,
           U.BLEED_END_PHLEB_L,U.BLEED_END_PHLEB_L2,U.BLEED_END_PHLEB_R,U.BLEED_END_PHLEB_R2,
           U.VOID_UNIT_ID,U.FIRST_REVIEWER_ID,U.CREDIT_SPONSOR
           from donations u where transaction_id=p_trans_id;

     cursor C2A (p_trans_id in varchar2 ) is select ua.attrib_code,
           ua.attrib_value from donation_attributes ua where transaction_id=p_trans_id
           order by 1 ;

    cursor C2B (p_trans_id in varchar2 ) is select inter_type, inter_code, originated_from, reason_code,
              eff_date ED, term_date TD from donor_interdictions where transaction_id=p_trans_id and
              inter_code not in (select inter_code from valid_regint_reasons where
                                  inter_reason in ('INTRFEMALE','INTRMALE'))
            order by 1 ;



  cursor C3 (p_trans_id in varchar2 )is select physical_code, physical_value,
            physical_value_repeat, inter_code, comments,EQUIP_REFERENCE,
            EQUIP_REFERENCE_REPEAT
            from physical_findings where transaction_id=p_trans_id;

   /* cursor C4 (p_trans_id in varchar2 )is select distinct question_code, response
            from health_history where transaction_id=p_trans_id;
   */


    cursor C4 (p_trans_id in varchar2 )is  select distinct A.question_code QC ,A.response res, B.display_order
           from health_history A, health_history_template B where
           A.TRANSACTION_ID=p_trans_id and A.template_id=B.template_id and
           a.question_code=b.question_code order by display_order;

   /* cursor C5 (p_trans_id in varchar2, p_ques_code in varchar2 ) is select A.question_code QC ,A.answer_code AC ,A.incident_date ID,
            A.def_thru_date DTD, A.comments COMM, A.inter_code ICODE,A.start_date SD, A.end_date ED,
            B.display_order from health_history A, health_history_template B where
            A.TRANSACTION_ID=p_trans_id and A.template_id=B.template_id and
            a.question_code=b.question_code and b.question_code=p_ques_code and
            a.answer_code not in ('Yes','YES','NO','No')  order by display_order;
  */


   cursor C5 (p_trans_id in varchar2, p_ques_code in varchar2 )is select question_code QC, answer_code AC, incident_date ID,
             def_thru_date DTD, start_date SD, end_date ED, inter_code ICODE ,comments COMM from health_history where
             transaction_id=p_trans_id and question_code=p_ques_code and
             answer_code not in ('Yes','YES','NO','No');


  cursor C6 (p_trans_id in varchar2 )is select letter_code, letter_id , signature_date, manual_signature_date
            from donor_consents where transaction_id=p_trans_id;

  cursor C7 (p_letter_id in varchar2 )is select letter_content from valid_letters where letter_id=p_letter_id and
            rownum = 1;

  cursor C8 (p_trans_id in varchar2) is select LKUP_UPDT_BY ,HLTH_UPDT_BY,PHY_UPDT_BY,PHELOB_UPDT_BY,UNIT_STATUS_UPDT_BY,
                                              LKUP_OVR_RSN,HLTH_HIST_OVR_RSN,PHY_OVR_RSN  from online_status where
                                              transaction_id=p_trans_id;

  cursor C8A (p_trans_id in varchar2) is select cn.note from donor_interdictions di, central_notes cn
                                             where di.transaction_id=p_trans_id and
                                                   di.inter_code='OVRDF' and
                                                   di.note_id=cn.note_id;

  cursor C9 (p_trans_id in varchar2) is select equip_or_supply, equip_supply_code, equip_reference,catalog_no,lot_no,
                                        qc_status from DONATION_EQUIP_SUPPLY_DET where transaction_id=p_trans_id;

  cursor C10 (p_trans_id in varchar2) is select tube_type, insert_user from donation_tubes where transaction_id=p_trans_id;

  Cursor C11 (p_donor_id in varchar2) is select DI.inter_type IT, DI.inter_code IC, VI.inter_desc IDESC ,
                                         DI.eff_date ED,DI.term_date TD
                                         from donor_interdictions DI,
                                         valid_interdictions VI where DI.donor_id=p_donor_id and
                                         DI.inter_code=VI.inter_code and
                                         DI.inter_type in ('SPINS','CAUTN','INFOR','DR');

 cursor C12 (p_trans_id in varchar2) is select source_code,inter_code, inter_type, originated_from, reason_code from
                                       donation_interdictions where transaction_id=p_trans_id and reason_code='QC';

cursor C13 (p_note_id in varchar2) is select insert_date, note from central_notes where note_id=p_note_id
                                      order by insert_date desc;

cursor C14 (p_trans_id in varchar2) is select verification_type, add_on_flag, count(*) cnt from MATERIAL_VERIFICATION_DET
                                   where unit_id in (select unit_id from donations where transaction_id=p_trans_id)
                                   group by VERIFICATION_TYPE, ADD_ON_FLAG;



END GENBDR;

```
