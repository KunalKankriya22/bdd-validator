--- Ver:02   10/15/20
---Ver:03    11/23/20 to add the chapter ID to the donor_idp.physical_findings call
-- Ver: 04  01/15/21 to add the chapter ID in the WEGHT physical finding call 2019.2.4 

CREATE OR REPLACE FORCE VIEW VISTA.VISTA_DONOR
(DONOR_ID, LAST_NAME, SPOUSE_NAME, FIRST_NAME, MIDDLE_NAME, 
 LOCATION_CODE, DONATION_ID, UNIT_ID, VISIT_DATE, VISIT_TIME, 
 GENDER, BLOOD_TYPE, DONATION_TYPE, PROCEDURE_CODE, PLATELET_COUNT, 
 CMV, HLA, HEMATOCRIT, HEIGHT, WEIGHT, 
 ETHNIC_ORIGIN, PLATELET_ELIGIBLE, PLASMA_ELIGIBLE, RBC_ELIGIBLE, WHOLE_BLOOD_ELIGIBLE, 
 NATIONAL_ID, DATE_OF_BIRTH, ADDRESS1, ADDRESS2, CITY, 
 DONOR_STATE, POSTAL_CODE, EMAIL, DAY_PHONE, NIGHT_PHONE, 
 TEMPERATURE, BP_SYSTOLIC, BP_DIASTOLIC, PULSE, HEMOGLOBIN, 
 CUSO4, STATUS, STATUS_DATE)
AS 
SELECT d.donor_id, d.last_name, '', d.first_name
, d.middle_name, v.location_id, t.transaction_id, t.unit_id, t.coll_date
, to_char(t.insert_date,'HH24:MI'), d.gender
, (SELECT m1.description from valid_master_codes m1
WHERE m1.code_type = 'ABO' AND d.blood_type = m1.code) blood_type
, t.donation_type, t.procedure_code
, donor_idp.latest_test_result(t.transaction_id,d.donor_id, 'PLT')
, DECODE(SUBSTR(NVL(donor_idp.latest_test_result(t.transaction_id,d.donor_id, 'CMV'),'U'), 1, 1), 'P', '1', 'R', '1', '0')
,  ''
, donor_idp.latest_test_result(t.transaction_id,d.donor_id, 'HCT')
, (to_number(SUBSTR(d.height, 1, 1)) * 12) + to_number(REPLACE(SUBSTR(d.height, 3, length(d.height)-2),'"'))
, DECODE(donor_idp.physical_findings(t.transaction_id, 'WEGHT',t.chapter_id)
, 'ACC', null, 'UNACC', null, 'UNANS', null
, donor_idp.physical_findings(t.transaction_id, 'WEGHT',t.chapter_id))
, d.ethnic_group
, ve.platelet_eligible, ve.plasma_eligible, ve.rbc_eligible, ve.whole_blood_eligible
--, donor_idp.donor_elig_prod(d.donor_id, 'PLT', t.donation_type)
--, donor_idp.donor_elig_prod(d.donor_id, 'PLASMA', t.donation_type)
--, donor_idp.donor_elig_prod(d.donor_id, 'RBC', t.donation_type)
--, donor_idp.donor_elig_prod(d.donor_id, 'WB', t.donation_type)
, NVL(to_char(d.ssn), d.alternate_id), d.date_of_birth, da.street_name, da.suite_apt
, vcs.city, vcs.state, vcs.zip, da.email
, da.d_area_code||'-'||SUBSTR(REPLACE(da.d_phone_no, '-'),1,3)
||'-'||SUBSTR(REPLACE(da.d_phone_no, '-'),4,4)
, da.h_area_code||'-'||SUBSTR(REPLACE(da.h_phone_no, '-'),1,3)
||'-'||SUBSTR(REPLACE(da.h_phone_no, '-'),4,4)  night_phone
, donor_idp.physical_findings(t.transaction_id, 'TEMPR', t.chapter_id)
, donor_idp.physical_findings(t.transaction_id, 'BPSY',t.chapter_id)
, donor_idp.physical_findings(t.transaction_id, 'BPDI',t.chapter_id)
, donor_idp.physical_findings(t.transaction_id, 'PULSE', t.chapter_id)
, donor_idp.physical_findings(t.transaction_id, 'HGB', t.chapter_id)
, donor_idp.physical_findings(t.transaction_id, 'CUSO4',t.chapter_id)
, os.idp_proc_status, t.insert_date
FROM donors d
, donor_addresses da
, donations t
, online_status os
, drives v
, locations l
, valid_city_state vcs
, vis_eligibility ve
WHERE os.idp_proc_status IN ('P', 'W')
AND da.address_type = 'RES'
AND t.drive_id = v.drive_id
AND t.chapter_id = v.chapter_id
AND v.location_id = l.location_id
AND v.chapter_id = l.chapter_id
AND da.usps_id = vcs.usps_id
AND d.donor_id = da.donor_id
AND d.chapter_id = da.chapter_id
AND d.donor_id = t.donor_id
--AND d.chapter_id = t.chapter_id
AND t.transaction_id = os.transaction_id
AND t.transaction_id = ve.transaction_id
AND t.unit_id IS NOT NULL
AND t.equip_type in (select code from valid_master_codes where
                     code_type='IDPEQ' and 
                     lifetrack_timezone_convert.get_local_time(t.chapter_id,sysdate) between
                     eff_date and nvl(term_date,lifetrack_timezone_convert.get_local_time(t.chapter_id,sysdate)+10))
AND os.status_flag NOT IN ('W','H')
/

--Create or Replace Public Synonym VISTA_DONOR for VISTA.VISTA_DONOR;

show errors

