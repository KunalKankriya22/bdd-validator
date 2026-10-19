-- Version: 01 Modified Date: 03/20/2013
-- Version: 02 Modified Date: 03/21/2013

truncate table UNIT_INTERDICTIONS;

truncate table UNIT_ATTRIBUTES;

truncate table COMPONENT_ATTRIBUTES;

truncate table COMPONENT_INTERDICTIONS;

truncate table POOLED_COMPONENTS; -- Added by Kishore on 03/21/2013

truncate table BATCH_INPUTS;

truncate table CARTONS;

truncate table UNITS;

truncate table UTRS;

truncate table UNIT_TEST_BASE;

truncate table pooled_components;

truncate table note_books;

delete from component_diff_det;

delete from component_diff_hdr;

delete from component_sp;

delete from component_sp_reag_hdr;

delete from COMPONENTS;

commit;