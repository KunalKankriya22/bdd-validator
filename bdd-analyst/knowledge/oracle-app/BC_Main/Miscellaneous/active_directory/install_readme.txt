Possible AD Setup Scenarios:

1) SSL not enabled without service account. 
  -- Use Scenario1.sql (Open sql and update the values based on client's setup)
      -- Network ACL setup for util, DBADMN accounts.
      -- Update ACTIVE_DIRECTORY_CONFIG table.
      -- Update LT_APPLICATION_CONFIG table.

2) SSL not enabled with service account.
  -- Use Scenario2.sql (Open sql and update the values based on client's setup)
      -- Network ACL setup for util, DBADMN accounts.
      -- Update ACTIVE_DIRECTORY_CONFIG table.
      -- Update LT_APPLICATION_CONFIG table.

3) SSL enabled.
  -- Run JLdap.sql
  -- Use Scenario3.sql (Open sql and update the values based on client's setup)
      -- JAVA socket permission setup.
      -- Update ACTIVE_DIRECTORY_CONFIG table.
      -- Update LT_APPLICATION_CONFIG table.

  