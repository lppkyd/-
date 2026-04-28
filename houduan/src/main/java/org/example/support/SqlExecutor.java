package org.example.support;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SqlExecutor {
    public static List<String> query(MysqlConnectionFactory connectionFactory, String sql, RowMapper mapper) {
        List<String> result = new ArrayList<>();
        try (Connection connection = connectionFactory.getConnection(); Statement statement = connection.createStatement(); ResultSet rs = statement.executeQuery(sql)) { while (rs.next()) result.add(mapper.map(rs)); } catch (SQLException e) { throw new RuntimeException("Database query failed: " + sql, e); }
        return result;
    }
    public static boolean execute(MysqlConnectionFactory connectionFactory, String sql, Object... args) {
        try (Connection connection = connectionFactory.getConnection(); PreparedStatement ps = connection.prepareStatement(sql)) { for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]); return ps.executeUpdate() > 0; } catch (SQLException e) { throw new RuntimeException("Database execute failed: " + sql, e); }
    }
}
