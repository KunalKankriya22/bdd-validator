/* This script will generate all the temporary tables
   Author       : Basker Edwin
   Date         : 05-21-2004
   Modified Date: 10-17-2009
   Modified By  : Basker Edwin
------------------------------------------------------------ */
--Table 4.1.1

drop public synonym mw_donors
/
drop table mw_donors
/
create table mw_donors
(
  DONOR_ID            VARCHAR2(10),
  CHAPTER_ID          VARCHAR2(4),
  LAST_NAME           VARCHAR2(30),
  FIRST_NAME          VARCHAR2(25),
  MIDDLE_NAME         VARCHAR2(25),
  NAME_SUFFIX         VARCHAR2(5),
  NAME_PREFIX         VARCHAR2(5),
  SSN                 VARCHAR2(11),
  DATE_OF_BIRTH       DATE,
  GENDER              VARCHAR2(1),
  BLOOD_TYPE          VARCHAR2(5),
  ETHNIC_GROUP        VARCHAR2(5),
  TOTAL_DONATIONS     NUMBER(4),
  TOTAL_CREDITS       NUMBER(4),
  CLAIMED_CREDITS     NUMBER(4),
  OLD_DONOR_ID        VARCHAR2(10),
  USER_ID             VARCHAR2(10),
  RECORD_DATE         DATE
  )
 storage (initial 30000k next 10000k)
/

--Table 4.1.2
drop public synonym  mw_donor_addresses
/
drop table  mw_donor_addresses
/
create table  mw_donor_addresses
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
 create public synonym mw_donor_addresses for mw_donor_addresses
/

--Table 4.1.3
drop public synonym mw_donor_email_address
/
drop table mw_donor_email_address
/
create table mw_donor_email_address
  (
   DONOR_ID       VARCHAR2(10),
   CHAPTER_ID     VARCHAR2(4),
   EMAIL_ADDRESS  VARCHAR2(128)
  )
  storage (initial 100k next 200k)
/

create public synonym mw_donor_email_address for mw_donor_email_address
/

--Table 4.1.4
drop public synonym mw_donor_interdictions
/
drop table mw_donor_interdictions
/
create table mw_donor_interdictions
 (
  DONOR_ID            VARCHAR2(10),
  CHAPTER_ID      VARCHAR2(4),
  INTER_CODE      VARCHAR2(5),
  EFFECTIVE_DATE  DATE,
  TERM_DATE       DATE,
  USER_ID         VARCHAR2(10),
  EVENT_DATE      DATE
  )
  /  
create public synonym mw_donor_interdictions for mw_donor_interdictions
/

--Table 4.1.5
drop public synonym mw_donor_comments
/
 drop table mw_donor_comments
/
create table mw_donor_comments
  (
   DONOR_ID       VARCHAR2(10),
   CHAPTER_ID     VARCHAR2(4),
   SEQ            NUMBER(3),
   COMMENTS       VARCHAR2(200),
   USER_ID        VARCHAR2(10),
   RECORD_DATE    DATE
   )
  storage (initial 500k next 500k)
/
create public synonym mw_donor_comments for mw_donor_comments
/

--Table 4.1.6
drop public synonym mw_donor_inter_comments
/
drop table mw_donor_inter_comments
/
create table mw_donor_inter_comments
 (
  DONOR_ID	      VARCHAR2(10),
  CHAPTER_ID      VARCHAR2(4),
  INTER_CODE      VARCHAR2(5),
  EFF_DATE        DATE,
  COM_TYPE        VARCHAR2(1),
  COMMENTS        VARCHAR2(240),
  TERM_DATE       DATE
  )
  storage (initial 20000k next 10000k)
/
 create public synonym mw_donor_inter_comments for mw_donor_inter_comments
 /

--Table 4.1.7
drop public synonym mw_donor_antigen
/
drop table mw_donor_antigen
/
 create table mw_donor_antigen
  (
    DONOR_ID           VARCHAR2(10),
    CHAPTER_ID         VARCHAR2(4),
    ANTIGEN_TYPE       VARCHAR2(5),
    ANTIGEN_TEST_ID     VARCHAR2(10),
    ANTIGEN_RESULT      VARCHAR2(5),
    USER_ID             VARCHAR2(10),
    RECORD_DATE        DATE
  )
  storage (initial 1000k next 500k)
/
create public synonym mw_donor_antigen for mw_donor_antigen
/


--Table 4.2.1
drop table mw_donations
/
drop public synonym mw_donations
/
create table mw_donations
  (
  UNIT_ID		   VARCHAR2(15),
  COLL_DATE	         DATE,
  CHAPTER_ID	   VARCHAR2(4),
  DONOR_ID 	         VARCHAR2(10),
  SECONDARY_ID       VARCHAR2(15),
  DONATION_TYPE      VARCHAR2(5),
  PROCEDURE_CODE     VARCHAR2(5),
  DRIVE_ID 	         VARCHAR2(10),
  LOCATION_ID        VARCHAR2(10),
  SPONSOR_ID	     VARCHAR2(10),
  DONOR_CUE	         VARCHAR2(1),
  BAG_TYPE 	         VARCHAR2(5),
  CREDIT_COUNT       NUMBER(2),
  USER_ID    	     VARCHAR2(3),
  RECORD_DATE      DATE  
  )
  storage (initial 30000k next 10000k)
/
create public synonym mw_donations for mw_donations
/

--Table 4.2.5
drop public synonym mw_donation_att_inter
/
drop table mw_donation_att_inter
/
create table mw_donation_att_inter
 (
   UNIT_ID   	      VARCHAR2(15),
   COLL_DATE	      DATE,
   CHAPTER_ID	      VARCHAR2(4),
   CLASS	          VARCHAR2(1),
   TYPE		          VARCHAR2(5),
   CODE		          VARCHAR2(5),
   EFF_DATE 	      DATE,
   TERM_DATE	      DATE,
   USER_ID            varchar2(10),
   RECORD_DATE        DATE  )
/
create public synonym mw_donation_att_inter for mw_donation_att_inter
/

--Table 4.2.6

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


--Table 4.2.7

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
 test_result varchar2(5),
 user_id     varchar2(10),
 record_date  date
 )
storage (initial 5M next 2M)
/

create public synonym mw_test_results for mw_test_results
/

--Table 4.3.1 (Drive information)

drop public synonym mw_drives
/
drop table mw_drives
/

 create table mw_drives
 (
   DRIVE_ID 	        VARCHAR2(10),
   CHAPTER_ID           VARCHAR2(4),
   RECRUITER_ID         VARCHAR2(6),
   TERRITORY_ID         VARCHAR2(10),
   LOCATION_ID          VARCHAR2(10),
   CONV_DRIVE_ID        VARCHAR2(10),
   DRIVE_TYPE	        VARCHAR2(5),
   DRIVE_CATEGORY       VARCHAR2(5),
   DRIVE_STATUS         VARCHAR2(5),
   DRIVE_DATE	        DATE,
   DRV_START_TIME       DATE,
   DRV_END_TIME         DATE,
   CANCEL_DATE          DATE,
   CANCEL_USER_ID       VARCHAR2(6),
   CAN_REASON_CODE	VARCHAR2(5),
   CAN_REASON	      VARCHAR2(50),
   OS_OK_FLAG	      VARCHAR2(1),
   DRIVE_FACILITY       VARCHAR2(5)
  )
  storage (initial 200k next 100k)
/

create public synonym mw_drives for mw_drives
/
grant all on mw_drives to public
/

--- Table 4.3.2 (Drive Statistical Info)

drop public synonym mw_drive_stat_info
/
drop table mw_drive_stat_info
/
create table mw_drive_stat_info
  (
   DRIVE_ID 	      VARCHAR2(10),
   CHAPTER_ID	      VARCHAR2(4),
   CAMPAIGN_ID          VARCHAR2(10),
   EVENT_ID 	      VARCHAR2(10),
   SCHEDULE_ID          VARCHAR2(10),
   DRV_LEAVE_TIME       DATE,
   DRV_RETURN_TIME	DATE,
   DRV_TRAVEL_TIME	DATE,
   DRV_SETUP_TIME       DATE,
   ESTIMATED_CPU        NUMBER(4),
   ACTUAL_CPU	      NUMBER(4),
   PROJECTED_SHOW       NUMBER(4),
   PROJECTED_DRAW       NUMBER(4),
   SIGNOFF_DATE         DATE,
   SIGNOFF_USER_ID	VARCHAR2(6)
  )
  storage (initial 500k next 500k)
/
create public synonym mw_drive_stat_info for mw_drive_stat_info
/
grant all on mw_drive_stat_info to public
/

--- Table 4.3.3 (Drive Sponsors)

drop public synonym mw_drive_sponsors
/
 drop table mw_drive_sponsors
/
create table mw_drive_sponsors
(
   DRIVE_ID 	      VARCHAR2(10),
   CHAPTER_ID	      VARCHAR2(4),
   SPONSOR_ID	      VARCHAR2(10),
   PROJECTED_SHOW     NUMBER(4),
   PROJECTED_DRAW     NUMBER(4),
   CONTACT_ID	      VARCHAR2(10),
   PROJ_DEFER_RATE    NUMBER(4)
  )
  storage (initial 500k next 500k)
/
create public synonym mw_drive_sponsors for mw_drive_sponsors
/
grant all on mw_drive_sponsors to public
/
--- Table 4.3.11 (Sponors)
drop public synonym mw_sponsors
/
drop table mw_sponsors
/
create table mw_sponsors
 (
   SPONSOR_ID	      VARCHAR2(10),
   CHAPTER_ID	      VARCHAR2(4),
   NAME		      VARCHAR2(50),
   TERRITORY_ID         VARCHAR2(10),
   CATEGORY 	      VARCHAR2(5),
   STATUS	            VARCHAR2(5),
   LINE_OF_BUSINESS     VARCHAR2(5),
   EMPLOYEE_BASE        NUMBER(6),
   PARENT_SPONSOR	      VARCHAR2(10),
   SPONSOR_RATING       VARCHAR2(5),
   DEF_LOCATION_ID	VARCHAR2(10),
   CONV_SPONSOR_ID	VARCHAR2(10),
   EFFECTIVE_DATE       DATE,
   TERM_DATE	      DATE
 )
  storage (initial 500k next 500k)
/
create public synonym mw_sponsors for mw_sponsors
/
grant all on mw_sponsors to public
/

--- Table.4.3.12 (Sponsor Addresses)

drop public synonym mw_sponsor_addresses
/
drop table mw_sponsor_addresses
/
create table mw_sponsor_addresses
  (
   ADDRESS_ID	      VARCHAR2(10),
   CHAPTER_ID	      VARCHAR2(4),
   STREET_NAME        VARCHAR2(50),
   SUITE_NUMBER       VARCHAR2(10),
   CITY		      VARCHAR2(40),
   STATE	      VARCHAR2(2),
   ZIP_CODE 	      VARCHAR2(10),
   USPS_ID	      NUMBER(6),
   DAY_AREA_CODE      VARCHAR2(5),
   DAY_PHONE_NUM      VARCHAR2(8),
   HOME_AREA_CODE     VARCHAR2(5),
   HOME_PHONE_NUM     VARCHAR2(8),
   PAGER	            VARCHAR2(14),
   EFFECTIVE_DATE       DATE,
   TERM_DATE	      DATE,
   MAPSCO	            VARCHAR2(10),
   CONTACT_ID	      VARCHAR2(10),
   ADDRESS_TYPE         VARCHAR2(5),
   EMAIL_ADDRESS        VARCHAR2(128),
   SPONSOR_ID	      VARCHAR2(10)
  )
  storage (initial 500k next 250k)
/
create public synonym mw_sponsor_addresses for mw_sponsor_addresses
/
grant all on mw_sponsor_addresses to public
/

--- Table.4.3.13 (Sponsor contacts)

drop public synonym mw_sponsor_contacts
/
drop table mw_sponsor_contacts
/
create table mw_sponsor_contacts
  (
   SPONSOR_ID	      VARCHAR2(10),
   CHAPTER_ID	      VARCHAR2(4),
   CONTACT_ID	      VARCHAR2(10),
   CONTACT_TYPE       VARCHAR2(5),
   ADDRESS_ID	      VARCHAR2(10),
   LAST_NAME	      VARCHAR2(30),
   FIRST_NAME	      VARCHAR2(25),
   MIDDLE_NAME        VARCHAR2(25),
   SALUTATIONS        VARCHAR2(5),
   TITLE	      VARCHAR2(25),
   EFFECTIVE_DATE      DATE,
   TERM_DATE	      DATE
  )
 storage (initial 500k next 500k)
/
create public synonym mw_sponsor_contacts for mw_sponsor_contacts
/
grant all on mw_sponsor_contacts to public
/

---Table.4.3.15 (Locations)

drop public synonym mw_locations
/
drop table mw_locations
/
 create table mw_locations
  (
   LOCATION_ID	      VARCHAR2(10),
   CHAPTER_ID	      VARCHAR2(4),
   LOCATION_TYPE      VARCHAR2(5),
   LOCATION_NAME      VARCHAR2(50),
   ADDRESS_ID	      VARCHAR2(10),
   TRAVEL_TIME	      NUMBER(4),
   TRAVEL_DISTANCE    NUMBER(4),
   OPEN_TIME	      DATE,
   CLOSE_TIME	      DATE,
   FDA_LICENSE_DATE   DATE,
   SITE_MANAGER	      VARCHAR2(6),
   ROTATION_FLAG      VARCHAR2(1),
   STAFF_FACILITY     VARCHAR2(5),
   ZONE_NAME	      VARCHAR2(5),
   CONV_LOCATION_ID   VARCHAR2(10),
   EFFECTIVE_DATE     DATE,
   TERM_DATE	      DATE
  )
  storage (initial 500k next 500k)
/
 create public synonym mw_locations for mw_locations
/
grant all on mw_locations to public
/
 
--Table unit log

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

