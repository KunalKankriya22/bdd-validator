DECLARE
   t_drive_id   varchar2(10);
   t_location_id   varchar2(10);
   t_coll_date   date;
   t_count      number;
   t_rej        number;
---
BEGIN
   dbms_output.enable(1000000);

  update mw_donations set donation_type='AU' where donation_type='AUTO';
 
   update mw_donations set donation_type='AU' where donation_type='ALLO' ;

   update mw_donations set donation_type='DR' where donation_type='DIR';

   update mw_donations set donation_type='TH' where donation_type='THER' ;

   update mw_donations set donation_type='SM' where donation_type='RSCH';

   update mw_donations set procedure_code='WB' where procedure_code='WB';
   
   update mw_donations set procedure_code='DR' where procedure_code='DRB';

   update mw_donations set procedure_code='DS' where procedure_code='DRBS';

   update mw_donations set procedure_code='PC' where procedure_code='PFFP';

   update mw_donations set procedure_code='RP' where procedure_code='RBCP';

   update mw_donations set procedure_code='SM' where procedure_code='SAMP';

   update mw_donations set procedure_code='PP' where procedure_code='SDP';

   -- the following needs to be chnaged after verified witht he customer

   update mw_donations set procedure_code='DP' where procedure_code='AFFP';

   update mw_donations set procedure_code='PP' where procedure_code='HJFP';

   update mw_donations set procedure_code='PP' where procedure_code='SDP7';
   
   update mw_donations set procedure_code='WB' where procedure_code='PALL';

  update mw_donations set donation_type='AL' where donation_type is null;
commit;

END;
/
