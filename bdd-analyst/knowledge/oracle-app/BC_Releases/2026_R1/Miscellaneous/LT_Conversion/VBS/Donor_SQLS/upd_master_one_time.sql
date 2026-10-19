update valid_master_codes set code='407' where code='DMIS' and 
code_type='SPCAT';
update valid_master_codes set code='408' where code='GOVT' and 
code_type='SPCAT';
update valid_master_codes set code='411' where code='HISCL' and 
code_type='SPCAT';
update valid_master_codes set code='412' where code='HOSP' and
code_type='SPCAT';
update valid_master_codes set code='442' where code='MEDIA' and 
code_type='SPCAT';
update valid_master_codes set code='466' where code='RELIG' and 
code_type='SPCAT';
update valid_master_codes set code='474' where code='UNION' and 
code_type='SPCAT';
update valid_master_codes set code='478' where code='CIVIC' and 
code_type='SPCAT';
update valid_master_codes set code='490' where code='BONE' and 
code_type='SPCAT';
update valid_master_codes set code='500' where code='CLLGE' and 
code_type='SPCAT';
update valid_master_codes set code='501' where code='CLLGI' and
code_type='SPCAT';
update valid_master_codes set code='570' where code='CMMTY' and 
code_type='SPCAT';
update valid_master_codes set code ='743' where code_type='LOB' and
code='BLDMG';
update valid_master_codes set code ='746' where code_type='LOB' and
code='BONE';
update valid_master_codes set code ='747' where code_type='LOB' and
code='CHURC';
update valid_master_codes set code ='749' where code_type='LOB' and
code='CIVIC';
update valid_master_codes set code ='750' where code_type='LOB' and
code='CORP';
update valid_master_codes set code ='751' where code_type='LOB' and
code='CORPO';
update valid_master_codes set code ='752' where code_type='LOB' and
code='FIXED';
update valid_master_codes set code ='753' where code_type='LOB' and
code='GOVM';
update valid_master_codes set code ='754' where code_type='LOB' and
code='GOVMT';
update valid_master_codes set code ='755' where code_type='LOB' and
code='HISCH';
update valid_master_codes set code ='757' where code_type='LOB' and
code='HOSP';
update valid_master_codes set code ='758' where code_type='LOB' and
code='INDTR';
update valid_master_codes set code ='759' where code_type='LOB' and
code='MILIT';
update valid_master_codes set code ='760' where code_type='LOB' and
code='MISC';
update valid_master_codes set code ='761' where code_type='LOB' and
code='RETAL';
update valid_master_codes set code ='762' where code_type='LOB' and
code='UNION';
update mw_sponsors set category='570' where category is null;
update mw_sponsors set territory_id='TERRY00001';

