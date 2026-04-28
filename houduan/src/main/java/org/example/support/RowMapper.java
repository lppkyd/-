package org.example.support;

import java.sql.ResultSet;
import java.sql.SQLException;

public interface RowMapper {
    String map(ResultSet rs) throws SQLException;
}
