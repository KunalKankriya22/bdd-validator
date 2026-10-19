Declare
 szStatus varchar2(20);
Begin
HL7_DONOR_INTERFACE.UPLOAD_ORU_INTO_LT('&1');
End;
/
exit;

