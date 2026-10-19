<?php
/**
 * Database Library for Okta PHP Applications
 * 
 * This file contains functions for handling database operations.
 */

require_once __DIR__ . '/common.php';

/**
 * Class to handle database operations
 */
class Database {
  private $conn;
  
  /**
   * Constructor
   * 
   * @param array $config Database configuration
   */
  public function __construct($config) {
    try {
      $this->conn = connectToDatabase($config);
      logMessage("Connected to database {$config['db_conn']}", 'INFO');
    } catch (Exception $e) {
      logMessage("Database connection failed: " . $e->getMessage(), 'ERROR');
      displayError("Failed to connect to database. Please try again later.");
    }
  }
  
  /**
   * Store user information in the database
   * 
   * @param string $username Username to store
   * @return string Generated unique ID
   * @throws Exception If database operation fails
   */
  public function storeUserInfo($username) {
    // Generate a unique ID
    $uniqueId = uniqid();
    
    try {
      // Insert into database
      $sql = 'INSERT INTO edi(ename, evalue) VALUES (:ename, :evalue)';
      $params = [
        ':ename' => $uniqueId,
        ':evalue' => $username
      ];
      
      executeQuery($this->conn, $sql, $params);
      logMessage("Stored user info for $username with ID $uniqueId", 'INFO');
      
      return $uniqueId;
    } catch (Exception $e) {
      logMessage("Failed to store user info: " . $e->getMessage(), 'ERROR');
      throw new Exception("Failed to store user information: " . $e->getMessage());
    }
  }
  
  /**
   * Retrieve user information from the database
   * 
   * @param string $uniqueId Unique ID to look up
   * @return string|false Username or false if not found
   */
  public function getUserInfo($uniqueId) {
    try {
      $sql = 'SELECT evalue FROM edi WHERE ename = :ename';
      $stmt = executeQuery($this->conn, $sql, [':ename' => $uniqueId]);
      
      $row = oci_fetch_assoc($stmt);
      if ($row) {
        logMessage("Retrieved user info for ID $uniqueId", 'INFO');
        return $row['EVALUE']; // Oracle returns column names in uppercase
      } else {
        logMessage("No user found with ID $uniqueId", 'WARNING');
        return false;
      }
    } catch (Exception $e) {
      logMessage("Failed to retrieve user info: " . $e->getMessage(), 'ERROR');
      return false;
    }
  }
  
  /**
   * Close the database connection
   * 
   * @return void
   */
  public function close() {
    if ($this->conn) {
      oci_close($this->conn);
      logMessage("Database connection closed", 'INFO');
    }
  }
  
  /**
   * Destructor to ensure connection is closed
   */
  public function __destruct() {
    $this->close();
  }
}
