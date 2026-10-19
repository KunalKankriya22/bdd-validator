import java.sql.*;
import java.util.*;
import java.io.*;

public class OracleQuery {
    public static void main(String[] args) throws Exception {
        Properties cfg = new Properties();
        try (FileInputStream fis = new FileInputStream("D:/bdd-analyst/db-tools/db.properties")) {
            cfg.load(fis);
        }

        String host = cfg.getProperty("db.host", "127.0.0.1");
        String port = cfg.getProperty("db.port", "15210");
        String sid  = cfg.getProperty("db.sid",  "QASDB");
        String user = cfg.getProperty("db.user");
        String pass = cfg.getProperty("db.pass");

        String url = "jdbc:oracle:thin:@" + host + ":" + port + ":" + sid;
        Class.forName("oracle.jdbc.OracleDriver");

        Properties connProps = new Properties();
        connProps.setProperty("user", user);
        connProps.setProperty("password", pass);
        connProps.setProperty("oracle.jdbc.fanEnabled", "false");
        connProps.setProperty("oracle.jdbc.jsonDefaultGetObjectType", "java.lang.String");

        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sql = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sql.append(line).append("\n");

        try (Connection conn = DriverManager.getConnection(url, connProps);
             Statement  stmt = conn.createStatement();
             ResultSet  rs   = stmt.executeQuery(sql.toString().trim())) {

            ResultSetMetaData meta = rs.getMetaData();
            int cols = meta.getColumnCount();

            StringJoiner header = new StringJoiner("\t");
            for (int i = 1; i <= cols; i++) header.add(meta.getColumnName(i));
            System.out.println(header);

            while (rs.next()) {
                StringJoiner row = new StringJoiner("\t");
                for (int i = 1; i <= cols; i++) {
                    String val = rs.getString(i);
                    row.add(val == null ? "NULL" : val);
                }
                System.out.println(row);
            }
        }
    }
}
