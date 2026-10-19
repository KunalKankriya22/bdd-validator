CREATE OR REPLACE AND COMPILE JAVA SOURCE NAMED JLdap AS

import javax.naming.*;
import javax.naming.directory.*;
import java.util.Hashtable;
import java.util.Properties;
import java.util.ArrayList;
import java.util.List;
import java.io.*;
import java.util.concurrent.*;

/**
 * Java LDAP Package 
 * 01/09/2024
 * Updates: 
    V02 - 05/12/2025 - Added support for ldapsearch with enhanced timeout handling (Rewrote JLDAP sql) - MLT-7894
 */
class JLdap {

    // Default timeout in seconds
    private static final int DEFAULT_TIMEOUT = 6;

    /**
     * Performs user authentication using ldapsearch
     * 
     * @param serviceUserDN The service account DN used to search for the user
     * @param serviceUserPassword The service account password
     * @param userIdentifier The user identifier (typically sAMAccountName)
     * @param userPassword The user's password to verify
     * @param identifyingAttribute The attribute to search for (e.g., sAMAccountName)
     * @param userBase The LDAP base to search in
     * @param ldapUrl The LDAP URL (e.g., ldaps://win2k.aub.edu.lb:636)
     * @return "SUCCESS", "NOTFOUND", or error message
     */
    public static String performAuthentication(String serviceUserDN, 
                                               String serviceUserPassword, 
                                               String userIdentifier,
                                               String userPassword,
                                               String identifyingAttribute,
                                               String userBase,
                                               String ldapUrl) {
        
        try {
            // Validate and normalize the LDAP URL
            if (ldapUrl == null || ldapUrl.trim().isEmpty()) {
                return "ERROR: LDAP URL is required";
            }
            
            // Ensure the URL has the correct protocol prefix
            if (!ldapUrl.startsWith("ldap://") && !ldapUrl.startsWith("ldaps://")) {
                return "ERROR: LDAP URL must start with ldap:// or ldaps://";
            }
            
            // Step 1: Find the user's DN using ldapsearch
            String userDN = findUserDN(serviceUserDN, serviceUserPassword, userIdentifier, 
                                      identifyingAttribute, userBase, ldapUrl, DEFAULT_TIMEOUT);
            
            if (userDN == null) {
                return "NOTFOUND";
            }
            
            if (userDN.startsWith("ERROR:")) {
                return userDN; // Return the error message
            }
            
            // Step 2: Verify the user's password using ldapsearch with the user's DN
            return verifyUserPassword(userDN, userPassword, ldapUrl, DEFAULT_TIMEOUT);
        } catch (Exception e) {
            System.out.println("Error in LDAP authentication: " + e.toString());
            e.printStackTrace();
            return "ERROR: " + e.toString();
        }
    }
    
    /**
     * Finds a user's Distinguished Name (DN) using ldapsearch with timeout
     */
    private static String findUserDN(String serviceUserDN, 
                                    String serviceUserPassword, 
                                    String userIdentifier,
                                    String identifyingAttribute,
                                    String userBase,
                                    String ldapUrl,
                                    int timeoutSeconds) {
        Process process = null;
        ExecutorService executor = null;
        
        try {
            // Escape special characters in the user identifier
            userIdentifier = escapeForLdapFilter(userIdentifier);
            
            // Calculate network timeout as 1/3 of the process timeout
            int netTimeout = Math.max(1, timeoutSeconds / 3);
            
            // Build ldapsearch command with multiple timeout options
            List<String> command = new ArrayList<>();
            
            // If on Linux/Unix, use the timeout command to enforce a hard timeout
            // This is commented out by default - uncomment if needed
            // command.add("timeout");
            // command.add(String.valueOf(timeoutSeconds));
            
            command.add("/usr/bin/ldapsearch");
            command.add("-H");
            command.add(ldapUrl);
            command.add("-D");
            command.add(serviceUserDN);
            command.add("-w");
            command.add(serviceUserPassword);
            command.add("-b");
            command.add(userBase);
            command.add("-s");
            command.add("sub");
            
            // Add multiple timeout options to ensure it works across different ldapsearch versions
            // Server-side search time limit
            command.add("-l");
            command.add(String.valueOf(timeoutSeconds));
            
            // Network timeout options - set to 1/3 of process timeout
            command.add("-o");
            command.add("nettimeout=" + netTimeout);
            
            // LDAP library timeout options
            command.add("-o");
            command.add("ldif-wrap=no");
            
            // Log the timeouts being used
            System.out.println("Using process timeout: " + timeoutSeconds + "s, network timeout: " + netTimeout + "s");
            
            // -LLL suppresses printing of LDAP result count, comments, and version number
            // for cleaner output with just the search results
            command.add("-LLL");
            command.add("(" + identifyingAttribute + "=" + userIdentifier + ")");
            command.add("dn");    // Only retrieve the DN attribute
            
            // Execute command
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true); // Merge stdout and stderr
            
            // Set a timeout for the process start
            long startTime = System.currentTimeMillis();
            process = pb.start();
            
            // Set up executor for timeout handling
            executor = Executors.newSingleThreadExecutor();
            
            // Create a callable task to read the process output
            final Process finalProcess = process;
            Future<String> future = executor.submit(new Callable<String>() {
                @Override
                public String call() throws Exception {
                    // Read output
                    BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getInputStream()));
                    StringBuilder output = new StringBuilder();
                    String line;
                    String dn = null;
                    
                    while ((line = reader.readLine()) != null) {
                        // Check if we've exceeded our timeout while reading
                        if ((System.currentTimeMillis() - startTime) > (timeoutSeconds * 1000)) {
                            throw new TimeoutException("Reading process output timed out");
                        }
                        
                        output.append(line).append("\n");
                        
                        // Extract DN from output
                        if (line.startsWith("dn: ")) {
                            dn = line.substring(4).trim();
                        }
                    }
                    
                    // Check exit code
                    int exitCode = finalProcess.waitFor();
                    if (exitCode != 0) {
                        System.out.println("ldapsearch failed with exit code " + exitCode);
                        System.out.println("Command output: " + output.toString());
                        return "ERROR: ldapsearch failed with exit code " + exitCode;
                    }
                    
                    // Return the DN if found, null otherwise
                    return dn;
                }
            });
            
            try {
                // Wait for the process to complete with timeout
                // Use a shorter timeout for the Future than for the process
                // to ensure we can clean up resources
                return future.get(timeoutSeconds, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                System.out.println("ldapsearch timed out after " + timeoutSeconds + " seconds");
                return "ERROR: LDAP search timed out";
            }
            
        } catch (Exception e) {
            System.out.println("Error executing ldapsearch: " + e.toString());
            e.printStackTrace();
            return "ERROR: " + e.toString();
        } finally {
            // Clean up resources
            if (process != null) {
                try {
                    process.destroyForcibly();
                    // Wait a short time for the process to be destroyed
                    process.waitFor(2, TimeUnit.SECONDS);
                } catch (Exception e) {
                    // Ignore exceptions in cleanup
                }
            }
            
            if (executor != null) {
                try {
                    executor.shutdownNow();
                    // Wait a short time for the executor to shutdown
                    executor.awaitTermination(2, TimeUnit.SECONDS);
                } catch (Exception e) {
                    // Ignore exceptions in cleanup
                }
            }
        }
    }
    
    /**
     * Verifies a user's password by attempting to bind with their DN
     */
    private static String verifyUserPassword(String userDN, 
                                           String userPassword,
                                           String ldapUrl,
                                           int timeoutSeconds) {
        Process process = null;
        ExecutorService executor = null;
        
        try {
            // Calculate network timeout as 1/3 of the process timeout
            int netTimeout = Math.max(1, timeoutSeconds / 3);
            
            // Build ldapsearch command with multiple timeout options
            List<String> command = new ArrayList<>();
            
            // If on Linux/Unix, use the timeout command to enforce a hard timeout
            // This is commented out by default - uncomment if needed
            // command.add("timeout");
            // command.add(String.valueOf(timeoutSeconds));
            
            command.add("/usr/bin/ldapsearch");
            command.add("-H");
            command.add(ldapUrl);
            command.add("-D");
            command.add(userDN);
            command.add("-w");
            command.add(userPassword);
            command.add("-b");
            command.add(userDN);
            command.add("-s");
            command.add("base");
            
            // Add multiple timeout options to ensure it works across different ldapsearch versions
            // Server-side search time limit
            command.add("-l");
            command.add(String.valueOf(timeoutSeconds));
            
            // Network timeout options - set to 1/3 of process timeout
            command.add("-o");
            command.add("nettimeout=" + netTimeout);
            
            // LDAP library timeout options
            command.add("-o");
            command.add("ldif-wrap=no");
            
            // Log the timeouts being used
            System.out.println("Using process timeout: " + timeoutSeconds + "s, network timeout: " + netTimeout + "s");
            
            // -LLL suppresses printing of LDAP result count, comments, and version number
            // for cleaner output with just the search results
            command.add("-LLL");
            command.add("(objectClass=*)");
            // 1.1 is a special attribute identifier that requests no attributes to be returned,
            // only the DNs of matching entries - makes the search more efficient
            command.add("1.1");
            
            // Execute command
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            
            // Set a timeout for the process start
            long startTime = System.currentTimeMillis();
            process = pb.start();
            
            // Set up executor for timeout handling
            executor = Executors.newSingleThreadExecutor();
            
            // Create a callable task to read the process output
            final Process finalProcess = process;
            Future<String> future = executor.submit(new Callable<String>() {
                @Override
                public String call() throws Exception {
                    // Read output (for error messages)
                    BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getInputStream()));
                    StringBuilder output = new StringBuilder();
                    String line;
                    
                    while ((line = reader.readLine()) != null) {
                        // Check if we've exceeded our timeout while reading
                        if ((System.currentTimeMillis() - startTime) > (timeoutSeconds * 1000)) {
                            throw new TimeoutException("Reading process output timed out");
                        }
                        
                        output.append(line).append("\n");
                    }
                    
                    // Check exit code
                    int exitCode = finalProcess.waitFor();
                    if (exitCode == 0) {
                        return "SUCCESS";
                    } else {
                        System.out.println("Authentication failed with exit code " + exitCode);
                        System.out.println("Command output: " + output.toString());
                        
                        // Check for specific error messages
                        String outputStr = output.toString().toLowerCase();
                        if (outputStr.contains("invalid credentials") || 
                            outputStr.contains("authentication failed")) {
                            return "INVALID_PASSWORD";
                        }
                        
                        return "ERROR: Authentication failed with exit code " + exitCode;
                    }
                }
            });
            
            try {
                // Wait for the process to complete with timeout
                // Use a shorter timeout for the Future than for the process
                // to ensure we can clean up resources
                return future.get(timeoutSeconds, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                System.out.println("ldapsearch authentication timed out after " + timeoutSeconds + " seconds");
                return "ERROR: LDAP authentication timed out";
            }
            
        } catch (Exception e) {
            System.out.println("Error verifying password: " + e.toString());
            e.printStackTrace();
            return "ERROR: " + e.toString();
        } finally {
            // Clean up resources
            if (process != null) {
                try {
                    process.destroyForcibly();
                    // Wait a short time for the process to be destroyed
                    process.waitFor(2, TimeUnit.SECONDS);
                } catch (Exception e) {
                    // Ignore exceptions in cleanup
                }
            }
            
            if (executor != null) {
                try {
                    executor.shutdownNow();
                    // Wait a short time for the executor to shutdown
                    executor.awaitTermination(2, TimeUnit.SECONDS);
                } catch (Exception e) {
                    // Ignore exceptions in cleanup
                }
            }
        }
    }
    
    /**
     * Escapes special characters in LDAP filter values
     */
    private static String escapeForLdapFilter(String input) {
        if (input == null) {
            return null;
        }
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '\\':
                    sb.append("\\5c");
                    break;
                case '*':
                    sb.append("\\2a");
                    break;
                case '(':
                    sb.append("\\28");
                    break;
                case ')':
                    sb.append("\\29");
                    break;
                case '\0':
                    sb.append("\\00");
                    break;
                default:
                    sb.append(c);
            }
        }
        return sb.toString();
    }
};
