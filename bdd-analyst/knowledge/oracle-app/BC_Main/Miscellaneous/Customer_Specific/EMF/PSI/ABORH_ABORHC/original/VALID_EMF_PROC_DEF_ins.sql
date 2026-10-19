SET DEFINE OFF;
INSERT INTO VALID_EMF_PROC_DEF
VALUES(
'ABORH','Process for IMPORT to schedule a test at the time of Import only on the cellular products.
Conditions
Import Contract = ABC123 (Configurable)
Lab Product Types = RBC, WB
Product checked in as Imported blood to the components table via the IMPORT screen (IMCHKIN)
Actions
Schedule Test RETYP and place HOLD on the unit.
If RETYP ABO test result is same as Historical ABORH test result, release the hold, otherwise leave the hold as it is.',TO_DATE('03152017','MMDDYYYY'),'','VDIMPROC',TO_DATE('03152017','MMDDYYYY'),'ACA001',null);

INSERT INTO VALID_EMF_PROC_DEF
VALUES(
'ABORHC','UPDATED Process for IMPORT to schedule a test at the time of Import only on the cellular products.
Conditions
Import Contract = ABC123 (Configurable)
Lab Product Types = RBC, WB
Product checked in as Imported blood to the components table via the IMPORT screen (IMCHKIN)
Actions
Schedule Test RETYP and place HOLD on the unit.
If RETYP ABO test result is same as Historical ABORH test result, release the hold, otherwise leave the hold as it is.',TO_DATE('03152017','MMDDYYYY'),'','VDIMPROC',TO_DATE('03152017','MMDDYYYY'),'HJK001',null
);

COMMIT;