/* This script will generate all the temporary tables
   Author       : Basker Edwin
   Date         : 05-21-2004
   Modified Date: 10-17-2009
   Modified By  : Basker Edwin
------------------------------------------------------------ */

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

--- Table 4.3.2 (Drive Stat Info)
drop public synonym mw_drive_stats
/
drop table mw_drive_stats
/
create table mw_drive_stats
  (
   DRIVE_ID 	      VARCHAR2(10),
   CHAPTER_ID	      VARCHAR2(4),
   CAMPAIGN_ID          VARCHAR2(10),
   EVENT_ID 	      VARCHAR2(10),
   SCHEDULE_ID          VARCHAR2(10),
   DRV_LEAVE_TIME       DATE,
   DRV_RETURN_TIME	DATE,
   DRV_TRAVEL_TIME	NUMBER,
   DRV_SETUP_TIME       NUMBER,
   ESTIMATED_CPU        NUMBER(4),
   ACTUAL_CPU	        NUMBER(4),
   PROJECTED_SHOW       NUMBER(4),
   PROJECTED_DRAW       NUMBER(4),
   SIGNOFF_DATE         DATE,
   SIGNOFF_USER_ID	VARCHAR2(6)
  )
  storage (initial 500k next 500k)
/
create public synonym mw_drive_stats_info for mw_drive_stats
/
grant all on mw_drive_stats to public
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
   PAGER	      VARCHAR2(14),
   EFFECTIVE_DATE     DATE,
   TERM_DATE	      DATE,
   MAPSCO	      VARCHAR2(10),
   CONTACT_ID	      VARCHAR2(10),
   ADDRESS_TYPE       VARCHAR2(5),
   EMAIL_ADDRESS      VARCHAR2(128),
   SPONSOR_ID	      VARCHAR2(10)
  )
  storage (initial 500k next 250k)
/
create public synonym mw_sponsor_addresses for mw_sponsor_addresses
/
grant all on mw_sponsor_addresses to public
/

---Table.450

drop table mw_locn_spcon_addresses
/
create table mw_locn_spcon_addresses
  (
   ADDRESS_ID         VARCHAR2(10),
   CHAPTER_ID         VARCHAR2(4),
   STREET_NAME        VARCHAR2(50),
   SUITE_NUMBER       VARCHAR2(10),
   CITY               VARCHAR2(40),
   STATE              VARCHAR2(2),
   ZIP_CODE           VARCHAR2(10),
   USPS_ID            NUMBER(6),
   DAY_AREA_CODE      VARCHAR2(5),
   DAY_PHONE_NUM      VARCHAR2(8),
   HOME_AREA_CODE     VARCHAR2(5),
   HOME_PHONE_NUM     VARCHAR2(8),
   PAGER              VARCHAR2(14),
   EFFECTIVE_DATE     DATE,
   TERM_DATE          DATE,
   MAPSCO             VARCHAR2(10),
   CONTACT_ID         VARCHAR2(10),
   ADDRESS_TYPE       VARCHAR2(5),
   EMAIL_ADDRESS      VARCHAR2(128),
   ACTUAL_ID         VARCHAR2(10)
  )
  storage (initial 500k next 250k)
/
create public synonym mw_locn_spcon_addresses for mw_locn_spcon_addresses
/
grant all on mw_locn_spcon_addresses to public
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
   EFFECTIVE_DAT      DATE,
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

