Declare
  CURSOR notes_cur is select a.donor_id,b.note||'*' szNote from donors a,
    central_notes b where a.note_id is not null and a.note_id=b.note_id;
   szAntCode   VARCHAR2(2000);  
   szAntRes     VARCHAR2(3000);
   szString    VARCHAR2(3000);
   szChar     VARCHAR2(1);
Begin
  dbms_output.enable(1000000);
   FOR CURREC in notes_cur loop
      szAntCode:=null;
      szChar:=null;
      szString:=null;
      szAntRes:=null;

     For i in 1.. length(currec.szNote) loop
         szChar:=substr(currec.szNote,i,1);
         IF szChar=',' or szChar=' 'or szChar='' or szChar='*' then
            If RTrim(LTrim(szString)) in ('POS','Pos','pos','pOS',
		        		'NEG','Neg','neg') then
	    
	        szAntRes:=RTrim(LTrim(szAntCode))||' '||szString;
               --dbms_output.put_line('Res='||szAntRes); 
               insert into mw_donor_antigen values (currec.donor_id,'WAD',null,
		  			     substr(szAntCode,1,5),szString);
                szAntCode:=null;
                szChar:=null;
                szString:=null;
                szAntRes:=null;
	     Else
               szAntCode:=szString;
                szString:=null;
                 -- dbms_output.put_line('SzAnt='||szAntCode);
             End If;
         ELSE  
            szString:=szString||szChar;
          --  dbms_output.put_line('SzString='||szAntCode);
         END IF;
     End loop;
   END LOOP;
END;

