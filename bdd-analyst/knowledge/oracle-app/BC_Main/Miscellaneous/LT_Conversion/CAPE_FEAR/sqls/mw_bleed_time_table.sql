
create table mw_donation_btime_info
 (
  UNIT_ID	      VARCHAR2(15),
  COLL_DATE       DATE,
  CHAPTER_ID      VARCHAR2(4),
  ARM	            VARCHAR2(1),
  SEQ	            NUMBER(1),
  START_TIME      DATE,
  PHLEB_ID_S      VARCHAR2(6),
  END_TIME        DATE,
  PHLEB_ID_R      VARCHAR2(6)
 ) 
 storage (initial 20000k next 5000k)
/

create public synonym mw_donation_btime_info for mw_donation_btime_info