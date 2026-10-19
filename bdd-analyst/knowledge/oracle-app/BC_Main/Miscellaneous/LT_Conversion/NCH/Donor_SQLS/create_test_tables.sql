/* This script will generate all the temporary tables
   Author       : Basker Edwin
   Date         : 05-21-2004
   Modified Date: 05-21-2004
   Modified By  : Basker Edwin
------------------------------------------------------------ */

--Table 1

drop public synonym mw_donation_comments
/
drop table mw_donation_comments
/
create table mw_donation_comments
 (
   UNIT_ID		      VARCHAR2(15),
   COLL_DATE	      DATE,
   CHAPTER_ID	      VARCHAR2(4),
   COMMENTS 	      VARCHAR2(200),
   SEQ		      NUMBER(3)
   )
 storage (initial 100k next 100k)
/
 create public synonym mw_donation_comments for mw_donation_comments
/
grant all on mw_donation_comments to public
/

--- Table 6

drop public synonym mw_donor_address_information
/


drop table mw_donor_address_information
/

create table mw_donor_address_information
  (
   DONOR_ID		     VARCHAR2(10),
   CHAPTER_ID	     VARCHAR2(4),
   ADDRESS_TYPE        VARCHAR2(5),
   STREET_NAME	     VARCHAR2(50),
   SUITE_NUMBER        VARCHAR2(10),
   CITY		     VARCHAR2(40),
   STATE		     VARCHAR2(2),
   ZIP_CODE		     VARCHAR2(10),
   USPS_ID	           NUMBER(6),
   DAY_AREA_CODE       VARCHAR2(5),
   DAY_PHONE_NUM       VARCHAR2(8),
   HOME_AREA_CODE      VARCHAR2(5),
   HOME_PHONE_NUM      VARCHAR2(8)
  )
  storage (initial 30000k next 5000k)
/

 create public synonym mw_donor_address_information for mw_donor_address_information
/

grant all on mw_donor_address_information to public
/

--Table 7


drop public synonym mw_donor_antigen
/

drop table mw_donor_antigen
/


 create table mw_donor_antigen
  (
    DONOR_ID 	       VARCHAR2(10),
    CHAPTER_ID	       VARCHAR2(4),
    ANTIGEN_TYPE       VARCHAR2(5),
    ANTIGEN_TEST_ID     VARCHAR2(10),
    ANTIGEN_RESULT      VARCHAR2(5)
  )
  storage (initial 1000k next 500k)
/

create public synonym mw_donor_antigen for mw_donor_antigen
/

 grant all on mw_donor_antigen to public
/

---Table 8

 drop public synonym mw_donor_comments
/

 drop table mw_donor_comments
/

 create table mw_donor_comments
  (
   DONOR_ID	      VARCHAR2(10),
   CHAPTER_ID     VARCHAR2(4),
   COMMENTS	      VARCHAR2(200),
   SEQ	      NUMBER(3)
   )
  storage (initial 500k next 500k)
/

create public synonym mw_donor_comments for mw_donor_comments
/

grant all on mw_donor_comments to public
/

--Table 10

 drop public synonym mw_donor_interdictions
/

drop table mw_donor_interdictions
/

create table mw_donor_interdictions
 (
  DONOR_ID	      VARCHAR2(10),
  CHAPTER_ID      VARCHAR2(4),
  INTER_CODE      VARCHAR2(5),
  EFFECTIVE_DATE  DATE,
  TERM_DATE       DATE
  )
  storage (initial 20000k next 10000k)
/
 create public synonym mw_donor_interdictions for mw_donor_interdictions
/
grant all on mw_donor_interdictions to public
/


--Table 15

 drop table mw_required_donation_info
/

drop public synonym mw_required_donation_info
/

create table mw_donations
  (
  UNIT_ID		  VARCHAR2(15),
  COLL_DATE	         DATE,
  CHAPTER_ID	   VARCHAR2(4),
  DONOR_ID 	         VARCHAR2(10),
  SECONDARY_ID       VARCHAR2(15),
  DONATION_TYPE      VARCHAR2(5),
  PROCEDURE_CODE     VARCHAR2(5),
  DRIVE_ID 	         VARCHAR2(10),
  LOCATION_ID        VARCHAR2(10),
  SPONSOR_ID	   VARCHAR2(10),
  DONOR_CUE	         VARCHAR2(1),
  BAG_TYPE 	         VARCHAR2(5),
  CREDIT_COUNT       NUMBER(2)
  )
  storage (initial 30000k next 10000k)
/

create public synonym mw_donations for mw_donations
/

grant all on mw_donations to public
/

--Table 16

drop public synonym mw_donor
/

drop table mw_donor
/

create table mw_donor
(
  DONOR_ID	      VARCHAR2(10),
  CHAPTER_ID	      VARCHAR2(4),
  LAST_NAME 	      VARCHAR2(30),
  FIRST_NAME	      VARCHAR2(25),
  MIDDLE_NAME	      VARCHAR2(25),
  NAME_SUFFIX	      VARCHAR2(5),
  NAME_PREFIX	      VARCHAR2(5),
  SSN		      VARCHAR2(11),
  DATE_OF_BIRTH       DATE,
  GENDER	      VARCHAR2(1),
  BLOOD_TYPE	      VARCHAR2(5),
  ETHNIC_GROUP          VARCHAR2(5),
  TOTAL_DONATIONS       NUMBER(4),
  TOTAL_CREDITS         NUMBER(4),
  CLAIMED_CREDITS       NUMBER(4),
  OLD_DONOR_ID          VARCHAR2(10),
  c_claimed_credits     VARCHAR2(4),
  LAST_DON_DATE         DATE,
  NEXT_ELIG_DATE         DATE
  )
 storage (initial 30000k next 10000k)
/

create public synonym mw_required_donor_information for mw_required_donor_information
/

grant all on mw_required_donor_information to public
/


--Table 23

drop public synonym mw_test_reults
/

drop table mw_test_reults
/

CREATE table mw_test_results
(donor_id   varchar2(10),
 chapter_id  varchar2(4),
 unit_id     varchar2(15),
 coll_date   date,
 test_type   varchar2(1),
 test_id     varchar2(10),
 test_result varchar2(5))
storage (initial 5M next 2M)
/

create public synonym mw_test_results for mw_test_results
/

grant all on mw_test_results to public
/

drop public synonym log_units
/

drop table log_units
/

CREATE table log_units(
 unit_id     varchar2(15),
 error_msg   varchar2(240))
storage (initial 2M next 2M)
/

create public synonym log_units for log_units
/
