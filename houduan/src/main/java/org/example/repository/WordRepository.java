package org.example.repository;

import org.example.support.MysqlConnectionFactory;
import org.example.support.SqlExecutor;

import java.util.List;

public class WordRepository {
    private final MysqlConnectionFactory connectionFactory;
    public WordRepository(MysqlConnectionFactory connectionFactory) { this.connectionFactory = connectionFactory; }

    public List<String> findAllCategoriesJson() { return SqlExecutor.query(connectionFactory, "select id, name, sort from category order by sort asc, id asc", rs -> "{\"id\":" + rs.getInt("id") + ",\"name\":\"" + escape(rs.getString("name")) + "\",\"sort\":" + rs.getInt("sort") + ",\"isSystem\":true}"); }
    public List<String> findAllDictsJson() { return SqlExecutor.query(connectionFactory, "select id, name, description, owner_admin_id, is_custom from dict order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"name\":\"" + escape(rs.getString("name")) + "\",\"description\":\"" + escape(rs.getString("description")) + "\",\"ownerAdminId\":" + rs.getInt("owner_admin_id") + ",\"isCustom\":" + rs.getBoolean("is_custom") + "}"); }
    public List<String> findWordsJson(String categoryId) { StringBuilder sql = new StringBuilder("select id, category_id, word, meaning, phonetic, example, recommended from word"); if (categoryId != null && !categoryId.isEmpty()) sql.append(" where category_id = ").append(Integer.parseInt(categoryId)); sql.append(" order by id desc"); return SqlExecutor.query(connectionFactory, sql.toString(), rs -> "{\"id\":" + rs.getInt("id") + ",\"categoryId\":" + rs.getInt("category_id") + ",\"dictId\":0,\"word\":\"" + escape(rs.getString("word")) + "\",\"meaning\":\"" + escape(rs.getString("meaning")) + "\",\"phonetic\":\"" + escape(rs.getString("phonetic")) + "\",\"example\":\"" + escape(rs.getString("example")) + "\",\"recommended\":" + rs.getBoolean("recommended") + "}"); }
    public List<String> findUsersJson() { return SqlExecutor.query(connectionFactory, "select id, openid, nickname, learned_count, favorite_count, wrong_count from user order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"openid\":\"" + escape(rs.getString("openid")) + "\",\"nickname\":\"" + escape(rs.getString("nickname")) + "\",\"learnedCount\":" + rs.getInt("learned_count") + ",\"favoriteCount\":" + rs.getInt("favorite_count") + ",\"wrongCount\":" + rs.getInt("wrong_count") + "}"); }
    public List<String> findStudyRecordsJson() { return SqlExecutor.query(connectionFactory, "select id, user_id, category_name, total_words, accuracy from study_record order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"userId\":" + rs.getInt("user_id") + ",\"categoryName\":\"" + escape(rs.getString("category_name")) + "\",\"totalWords\":" + rs.getInt("total_words") + ",\"accuracy\":" + rs.getInt("accuracy") + "}"); }
    public List<String> findFavoritesJson() { return SqlExecutor.query(connectionFactory, "select id, user_id, word_id, word, trans from favorite order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"userId\":" + rs.getInt("user_id") + ",\"wordId\":" + rs.getInt("word_id") + ",\"word\":\"" + escape(rs.getString("word")) + "\",\"trans\":\"" + escape(rs.getString("trans")) + "\"}"); }
    public List<String> findSavedWordsJson() { return SqlExecutor.query(connectionFactory, "select id, user_id, word, trans, phonetic, example from saved_word order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"userId\":" + rs.getInt("user_id") + ",\"word\":\"" + escape(rs.getString("word")) + "\",\"trans\":\"" + escape(rs.getString("trans")) + "\",\"phonetic\":\"" + escape(rs.getString("phonetic")) + "\",\"example\":\"" + escape(rs.getString("example")) + "\"}"); }
    public List<String> findErrorWordsJson() { return SqlExecutor.query(connectionFactory, "select id, user_id, word, trans, dict_id, wrong_count, last_wrong_at from error_word order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"userId\":" + rs.getInt("user_id") + ",\"word\":\"" + escape(rs.getString("word")) + "\",\"trans\":\"" + escape(rs.getString("trans")) + "\",\"dictId\":\"" + escape(rs.getString("dict_id")) + "\",\"wrongCount\":" + rs.getInt("wrong_count") + "}"); }
    // 替换 WordRepository.java 中的这4个方法：
    public List<String> findStudyRecordsJsonByUser(int userId) { return SqlExecutor.query(connectionFactory, "select id, user_id, category_name, total_words, accuracy, created_at from study_record where user_id = "+userId+" order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"userId\":" + rs.getInt("user_id") + ",\"categoryName\":\"" + escape(rs.getString("category_name")) + "\",\"totalWords\":" + rs.getInt("total_words") + ",\"accuracy\":" + rs.getInt("accuracy") + ",\"createdAt\":\"" + rs.getString("created_at") + "\"}"); }

    public List<String> findFavoritesJsonByUser(int userId) { return SqlExecutor.query(connectionFactory, "select id, user_id, word_id, word, trans, created_at from favorite where user_id = "+userId+" order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"userId\":" + rs.getInt("user_id") + ",\"wordId\":" + rs.getInt("word_id") + ",\"word\":\"" + escape(rs.getString("word")) + "\",\"trans\":\"" + escape(rs.getString("trans")) + "\",\"createdAt\":\"" + rs.getString("created_at") + "\"}"); }

    public List<String> findErrorWordsJsonByUser(int userId) { return SqlExecutor.query(connectionFactory, "select id, user_id, word, trans, dict_id, wrong_count, last_wrong_at from error_word where user_id = "+userId+" order by wrong_count desc, last_wrong_at desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"userId\":" + rs.getInt("user_id") + ",\"word\":\"" + escape(rs.getString("word")) + "\",\"trans\":\"" + escape(rs.getString("trans")) + "\",\"dictId\":\"" + escape(rs.getString("dict_id")) + "\",\"wrongCount\":" + rs.getInt("wrong_count") + ",\"lastWrongAt\":\"" + rs.getString("last_wrong_at") + "\"}"); }

    public List<String> findSavedWordsJsonByUser(int userId) { return SqlExecutor.query(connectionFactory, "select id, user_id, word, trans, phonetic, example, created_at from saved_word where user_id = "+userId+" order by id desc", rs -> "{\"id\":" + rs.getInt("id") + ",\"userId\":" + rs.getInt("user_id") + ",\"word\":\"" + escape(rs.getString("word")) + "\",\"trans\":\"" + escape(rs.getString("trans")) + "\",\"phonetic\":\"" + escape(rs.getString("phonetic")) + "\",\"example\":\"" + escape(rs.getString("example")) + "\",\"createdAt\":\"" + rs.getString("created_at") + "\"}"); }

    public boolean clearFavoritesByUser(int userId) { return SqlExecutor.execute(connectionFactory, "delete from favorite where user_id=?", userId); }
    public boolean clearErrorsByUser(int userId) { return SqlExecutor.execute(connectionFactory, "delete from error_word where user_id=?", userId); }
    public boolean clearStudyRecordsByUser(int userId) { return SqlExecutor.execute(connectionFactory, "delete from study_record where user_id=?", userId); }
    public boolean clearSavedWordsByUser(int userId) { return SqlExecutor.execute(connectionFactory, "delete from saved_word where user_id=?", userId); }
    public boolean deleteUser(int userId) { return SqlExecutor.execute(connectionFactory, "delete from user where id=?", userId); }

    public boolean insertCategory(String name, int sort, boolean isSystem) { return SqlExecutor.execute(connectionFactory, "insert into category(name, sort) values(?,?)", name, sort); }
    public boolean updateCategory(int id, String name, int sort, boolean isSystem) { return SqlExecutor.execute(connectionFactory, "update category set name=?, sort=? where id=?", name, sort, id); }
    public boolean deleteCategory(int id) { return SqlExecutor.execute(connectionFactory, "delete from category where id=?", id); }
    public boolean insertDict(String name, String description, int ownerAdminId, boolean isCustom) { return SqlExecutor.execute(connectionFactory, "insert into dict(name, description, owner_admin_id, is_custom) values(?,?,?,?)", name, description, ownerAdminId, isCustom); }
    public boolean updateDict(int id, String name, String description) { return SqlExecutor.execute(connectionFactory, "update dict set name=?, description=? where id=?", name, description, id); }
    public boolean deleteDict(int id) { return SqlExecutor.execute(connectionFactory, "delete from dict where id=?", id); }
    public boolean insertWord(Integer categoryId, Integer dictId, String word, String meaning, String phonetic, String example, int recommended) { return SqlExecutor.execute(connectionFactory, "insert into word(category_id, dict_id, word, meaning, phonetic, example, recommended) values(?,?,?,?,?,?,?)", categoryId, dictId, word, meaning, phonetic, example, recommended); }
    public boolean updateWord(int id, Integer categoryId, Integer dictId, String word, String meaning, String phonetic, String example, int recommended) { return SqlExecutor.execute(connectionFactory, "update word set category_id=?, dict_id=?, word=?, meaning=?, phonetic=?, example=?, recommended=? where id=?", categoryId, dictId, word, meaning, phonetic, example, recommended, id); }
    public boolean deleteWord(int id) { return SqlExecutor.execute(connectionFactory, "delete from word where id=?", id); }

    // 修复外键和字段缺失问题
    public boolean addFavorite(int userId, int wordId, String word, String trans) { return SqlExecutor.execute(connectionFactory, "insert into favorite(user_id, word_id, word, trans) values(?,?,?,?)", userId, wordId, word, trans); }
    public boolean deleteFavorite(int id) { return SqlExecutor.execute(connectionFactory, "delete from favorite where id=?", id); }
    // 使用 MySQL 内置函数 CURRENT_TIMESTAMP 防止 long 转 datetime 报错
    public boolean addErrorWord(int userId, String word, String trans, String dictId) { return SqlExecutor.execute(connectionFactory, "insert into error_word(user_id, word, trans, dict_id, wrong_count, last_wrong_at) values(?,?,?,?,1, CURRENT_TIMESTAMP)", userId, word, trans, dictId); }
    public boolean deleteErrorWord(int id) { return SqlExecutor.execute(connectionFactory, "delete from error_word where id=?", id); }
    // 移除了表中不存在的 dictionary_id 字段
    public boolean addStudyRecord(int userId, String categoryName, int totalWords, int accuracy) { return SqlExecutor.execute(connectionFactory, "insert into study_record(user_id, category_name, total_words, accuracy) values(?,?,?,?)", userId, categoryName, totalWords, accuracy); }
    public boolean deleteStudyRecord(int id) { return SqlExecutor.execute(connectionFactory, "delete from study_record where id=?", id); }
    // 将 usphone/ukphone 对齐为表中的 phonetic 字段
    public boolean addSavedWord(int userId, String word, String trans, String usphone, String ukphone, String example) { return SqlExecutor.execute(connectionFactory, "insert into saved_word(user_id, word, trans, phonetic, example) values(?,?,?,?,?)", userId, word, trans, usphone, example); }
    public boolean deleteSavedWord(int id) { return SqlExecutor.execute(connectionFactory, "delete from saved_word where id=?", id); }

    private String escape(String text) { return text == null ? "" : text.replace("\\", "\\\\").replace("\"", "\\\""); }
}