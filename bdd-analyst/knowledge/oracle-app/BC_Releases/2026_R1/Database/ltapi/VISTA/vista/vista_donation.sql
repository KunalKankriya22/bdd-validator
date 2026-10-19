Declare
 szTransID varchar2(20);
 szUnitID  varchar2(15); 
Begin
LT_IDP_FEED.LOAD_VISTA_DONATION('&1','|','NONE',szTransID,szUnitID);
If szTransID!='FAIL' then 
   LT_IDP_FEED.PROCESS_VISTA_DONATION(szTransID,szUnitID,'DAL');
End If;
End;
/
exit;

