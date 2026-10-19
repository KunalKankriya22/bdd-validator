Declare
  CURSOR notes_cur is select a.donor_id,b.note||'*' szNote from donors a,
    central_notes b where a.note_id is not null and a.note_id=b.note_id;
   --A.LAST_NAME='NIELSEN' and a.date_of_birth='10-jul-1985';
   szChar     VARCHAR2(1);
   digitsCount number:=0;
   szDL      varchar2(20);
   szString   varchar2(3000);
Begin
  dbms_output.enable(1000000);
   FOR CURREC in notes_cur loop
      szChar:=null;
       digitsCount:=0;
     For i in 1.. length(currec.szNote) loop
          szChar:=substr(currec.szNote,i,1);
         IF szChar=',' or szChar=' 'or szChar='' or szChar='*' then
           
            --dbms_output.put_line('Digits='||to_char(digitsCount)||
            --              '  SzLic:='||szString);
             
             If digitsCount >=7 then
                digitsCount:=0;      	        
                szDL:=RTrim(LTrim(szString));
                dbms_output.put_line('Donor='||currec.donor_id||' DL='||szDL); 
               insert into mw_donor_alt_id values (currec.donor_id,
                                                szString,'DL');
               UPDATE donors set alternate_id=szString,alternate_id_type='DL'
               where donor_id=currec.donor_id;
                szChar:=null;
                szString:=null;
	     Else
                szString:=null;
             End If;
         ELSE 
              If szChar in ('0','1','2','3','4','5','6','7','8','9') then
                  digitsCount:=digitsCount+1;       
              else
                 digitsCount:=0;
              end if;            
                    szString:=szString||szChar;
             ---       dbms_output.put_line('SzLic:='||szString);
         END IF;
     End loop;
   END LOOP;
COMMIT;
END;

