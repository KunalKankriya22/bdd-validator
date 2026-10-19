--------------------------------------------------------
--  DDL for Trigger VALID_CATALOGS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_CATALOGS_BEFORE_DELETE" 
before delete
on valid_catalogs
for each row
begin
	insert into valid_catalogs_audit
	(
		catalog_number,
		weight_of_bag,
		manufacturer,
		total_bags_in_set,
		anticoagulant,
		additive_solution,
		collection_volume,
		bag_storage_restriction,
		bag_volume,
		bag_type,
		eff_date,
		term_date,
		last_modified_date,
		audit_key,
		program_id,
		audit_insert_dats,
		audit_insert_user
	)
	values
	(
		:old.catalog_number,
		:old.weight_of_bag,
		:old.manufacturer,
		:old.total_bags_in_set,
		:old.anticoagulant,
		:old.additive_solution,
		:old.collection_volume,
		:old.bag_storage_restriction,
		:old.bag_volume,
		:old.bag_type,
		:old.eff_date,
		:old.term_date,
		:old.last_modified_date,
		:old.audit_key,
		'DELETE',
		sysdate,
		lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_CATALOGS_BEFORE_DELETE" ENABLE;
