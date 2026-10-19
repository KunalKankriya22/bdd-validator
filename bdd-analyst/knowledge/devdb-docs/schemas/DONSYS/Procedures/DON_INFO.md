---
tags:
  - procedure
  - DONSYS
---
# DON_INFO

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Type**: FUNCTION

## Dependencies

- [[schemas/DONSYS/Tables/DONATIONS|DONATIONS]] (TABLE)
- [[schemas/DONSYS/Tables/DONORS|DONORS]] (TABLE)
- [[schemas/DONSYS/Tables/DONOR_ADDRESSES|DONOR_ADDRESSES]] (TABLE)
- [[schemas/DONSYS/Tables/DONOR_COMMUNICATIONS|DONOR_COMMUNICATIONS]] (TABLE)
- [[schemas/DONSYS/Tables/DONOR_INTERDICTIONS|DONOR_INTERDICTIONS]] (TABLE)
- DON_STD (PACKAGE in DONSYS)
- [[schemas/DONSYS/Tables/DRIVES|DRIVES]] (TABLE)
- [[schemas/DONSYS/Tables/DRIVE_SPONSORS|DRIVE_SPONSORS]] (TABLE)
- [[schemas/DONSYS/Tables/EMPLOYEES|EMPLOYEES]] (TABLE)
- [[schemas/DONSYS/Tables/SPONSORS|SPONSORS]] (TABLE)
- STANDARD (PACKAGE in SYS)
- SYS_STUB_FOR_PURITY_ANALYSIS (PACKAGE in SYS)
- [[schemas/DONSYS/Tables/VALID_CITY_STATE|VALID_CITY_STATE]] (TABLE)
- [[schemas/DONSYS/Tables/VALID_MASTER_CODES|VALID_MASTER_CODES]] (TABLE)

## Source Code

```plsql
FUNCTION              "DON_INFO" (donorid varchar2) return varchar2   IS
  donorinfo    varchar2(32000);
  donorinfo1  varchar2(32000);
  sponsorid    varchar2(10);
BEGIN
 SELECT  'Information for Donor: '||d.donor_id||chr(10)||chr(10)||
               'Name: '||d.last_name || DECODE(d.first_name, NULL, NULL, ', ') ||d.first_name || ' ' ||d.middle_name||chr(10)||
               'ABO: '||vmc.description||'			SSN: '||DECODE(d.ssn, NULL, NULL, SUBSTR(TO_CHAR(d.ssn),1,3) || '-' || SUBSTR(TO_CHAR(d.ssn),4,2)
				|| '-' || SUBSTR(TO_CHAR(d.ssn),6))||chr(10)||
	'DOB: '||TO_CHAR(d.date_of_birth, 'MM-DD-YYYY')||'			Sex: '||d.gender||chr(10)||chr(10)||
	'Address: '||street_name ||decode(suite_apt, null, null, ' #') || suite_apt ||chr(10)||
                'City: '||vcs.city || decode(da.usps_id, null,null,', ') || vcs.state || decode(da.usps_id, null,null,'-') || vcs.zip ||chr(10)||
                'Phone'||decode(h_area_code || h_phone_no, null, null, ' Home:') ||
                h_area_code || decode(h_area_code, null, null, decode(h_phone_no, null, null, '-')) ||
	substr(h_phone_no, 1, 3) || decode(h_phone_no, null,null, '-') || substr(h_phone_no, 4)||
                decode(d_area_code || d_phone_no, null, null, '  Work:') ||
                d_area_code || decode(d_area_code, null, null, decode(d_phone_no, null, null, '-')) ||
	substr(d_phone_no, 1, 3) ||decode(d_phone_no, null,null, '-') ||substr(d_phone_no, 4)||chr(10)
      INTO  donorinfo
    FROM  donors d,
                donor_addresses da,
                valid_city_state vcs,
                valid_master_codes vmc
  WHERE  d.donor_id 	= da.donor_id
       AND  d.blood_type 	= vmc.code(+)
       AND  vmc.code_type(+)       = 'ABO'
       AND da.usps_id               = vcs.usps_id
       AND d.donor_id = donorid
       AND d.chapter_id = 'WAD'
       AND da.chapter_id = 'WAD';

 SELECT 	'Lifetime Don: '||DON_STD.DONOR_LIFE_CREDIT_COUNT(D.DONOR_ID, 'WAD')||
      	'			Year To Date Don: '||DON_STD.DONOR_YTD_CREDIT_COUNT(D.DONOR_ID, 'WAD')||chr(10)||
                'Lifetime Gallon: '||FLOOR(DON_STD.DONOR_LIFE_CREDIT_COUNT(D.DONOR_ID, 'WAD' ) / 8 )||
                '		Units for Next Gallon Mark: '||(8 - mod(DON_STD.DONOR_LIFE_CREDIT_COUNT(D.DONOR_ID, 'WAD'), 8 ) )||
                '	Claim Don: '||d.CLAIMED_DONATION don_info
    INTO donorinfo1
    FROM  donors d
     WHERE  d.donor_id = donorid
       AND d.chapter_id = 'WAD' ;
   donorinfo := chr(10)||donorinfo||chr(10)||donorinfo1||chr(10);

/*****************DONOR COMMUNICATIONS*************************************/
declare cursor c1 is
select  (d.action_code||'	'||d.request_code||'	'||to_char(d.com_date,'MM-DD-RR')||'	'|| Initcap(e.last_name||', '||e.first_name)
) DNAME
from 	DONOR_COMMUNICATIONS d, employees e
where d.chapter_id = 'WAD'
   and d.donor_id = donorid
   AND D.COM_TYPE = 'TELE'
  AND   e.emp_class = 'TELRC'
  AND   e.staff_no = d.insert_user
  order by com_date desc;
  donorinfo2 varchar2(14000);
begin
  donorinfo2 := NULL;
  donorinfo1 := NULL;
  for c1rec in c1
  loop
     donorinfo2 := c1rec.dname;
    IF   donorinfo1 is NOT NULL THEN
      donorinfo1 := donorinfo1||chr(10)||donorinfo2;
      exit;
   ELSE
      donorinfo1 := 'Donor Communication (Last Contact) '||chr(10)||'--------------------------------------------------------------------------------------------------';
      donorinfo1 := donorinfo1||chr(10)||donorinfo2;
   END IF;
  end loop;

   IF donorinfo1 is NOT NULL THEN
       donorinfo := donorinfo||chr(10)||donorinfo1||chr(10)||chr(10);
   END IF;
end;

/******************DONOR DONATIONS********************************************/
declare cursor c1 is
select (NVL(d.UNIT_ID, d.DEFERRAL_ID)||' '||
	to_char(d.COLL_DATE,'MM-DD-RR')||' '||
	d.DONATION_TYPE||' '||
	d.PROCEDURE_CODE||' '||d.DRIVE_ID||' '||substr(ss.name,1,34)) dname, ss.sponsor_id
from 	DONATIONS d, drive_sponsors ds, sponsors ss
where d.chapter_id = 'WAD'
   and d.drive_id = ds.drive_id
   and ss.sponsor_id = ds.sponsor_id
   and ds.sponsor_id in (
     select distinct s.sponsor_id
       from sponsors s
       where s.sponsor_id = ds.sponsor_id
          and rownum < 2 )
   and d.donor_id = donorid
   order by d.coll_date desc;
  donorinfo2 varchar2(14000);
  donrownum number(3) := 0;
begin
  donorinfo2 := NULL;
  donorinfo1 := NULL;
  for c1rec in c1
  loop
     donorinfo2 := c1rec.dname;
    IF   donorinfo1 is NOT NULL THEN
      donorinfo1 := donorinfo1||chr(10)||donorinfo2;
            donrownum :=  donrownum +1 ;
   ELSE
      donorinfo1 := 'Recent Donor Donations'||chr(10)||'--------------------------------------------------------------------------------------------------';
      donorinfo1 := donorinfo1||chr(10)||donorinfo2;
      sponsorid := c1rec.sponsor_id;
      donrownum := 1;
   END IF;
   IF  donrownum > 20 THEN
      exit;
   END IF;
  end loop;

   IF donorinfo1 is NOT NULL THEN
       donorinfo := donorinfo||chr(10)||donorinfo1||chr(10)||chr(10);
   END IF;

end;

/******************Future Drives*******************************************/
IF  sponsorid is NOT NULL THEN
BEGIN
declare cursor c1 is
select (d.drive_id||'	 '||
           to_char(d.drive_date,'MM-DD-RR')
           ) dname
from   DRIVES d
where d.drive_id in ( select ds.drive_id from drive_sponsors ds
where ds.sponsor_id = sponsorid)
and d.drive_date between trunc(sysdate) and trunc(sysdate)+365
and d.status != 'CANCL'
and rownum < 6 ;
 donorinfo2 varchar2(14000);
begin
  donorinfo2 := NULL;
  donorinfo1 := NULL;
  for c1rec in c1
  loop
     donorinfo2 := c1rec.dname;
    IF   donorinfo1 is NOT NULL THEN
      donorinfo1 := donorinfo1||chr(10)||donorinfo2;
   ELSE
      donorinfo1 := 'Future Drives for Sponsor -- '||sponsorid||chr(10)||'--------------------------------------------------------------------------------------------------';
      donorinfo1 := donorinfo1||chr(10)||donorinfo2;
   END IF;
  end loop;
   IF donorinfo1 is NOT NULL THEN
       donorinfo := donorinfo||chr(10)||donorinfo1||chr(10)||chr(10);
   END IF;
end;
END;
 sponsorid := NULL;
END IF;
/*************** Donor Attributes*************************************************/
declare cursor c1 is
select	( UNIT_ID||'  '||
	INTER_CODE||'  '||
	TO_CHAR(EFF_DATE, 'MM-DD-YY')||'  '||
	TO_CHAR(TERM_DATE, 'MM-DD-YY')||'  '||
	REASON_CODE) dname
from	DONOR_INTERDICTIONS
where chapter_id = 'WAD'
and donor_id = donorid
and sysdate between eff_date and nvl(term_date, sysdate+1);
  donorinfo2 varchar2(14000);
begin
  donorinfo2 := NULL;
  donorinfo1 := NULL;
  for c1rec in c1
  loop
     donorinfo2 := c1rec.dname;
    IF   donorinfo1 is NOT NULL THEN
      donorinfo1 := donorinfo1||chr(10)||donorinfo2;
   ELSE
      donorinfo1 := 'Donor Attributes'||chr(10)||'--------------------------------------------------------------------------------------------------';
      donorinfo1 := donorinfo1||chr(10)||donorinfo2;
   END IF;
  end loop;
   IF donorinfo1 is NOT NULL THEN
       donorinfo := donorinfo||chr(10)||donorinfo1;
   END IF;
end;
return(donorinfo);
END;

```
