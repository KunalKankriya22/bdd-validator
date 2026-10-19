DECLARE
   cursor c1 is select a.unit_id,b.transaction_id from
   mw_donor_side_attrib a ,donations b where
   a.unit_id=b.unit_id;

BEGIN
   For Z in c1 loop
     insert into donation_attributes
     (TRANSACTION_ID,
      CHAPTER_ID   ,
      ATTRIB_CODE  ,
      ATTRIB_VALUE ,
      PROGRAM_ID   ,
      INSERT_DATE  ,
      INSERT_USER  ,
       AUDIT_KEY )
    VALUES(Z.transaction_id,'WAD','VENI','01','510C',
          sysdate,'DONSYS',audit_seq.nextval);
   End loop;
commit;
END;
