package org.example.service;

import org.example.repository.WordRepository;
import org.example.support.JsonResponses;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class WordService {
    private final WordRepository repository;
    private static final Map<Integer, String> SNAPSHOTS = new ConcurrentHashMap<>();

    public WordService(WordRepository repository) { this.repository = repository; }
    public String listCategoriesJson() { return JsonResponses.wrapData(repository.findAllCategoriesJson()); }
    public String listDictsJson() { return JsonResponses.wrapData(repository.findAllDictsJson()); }
    public String listWordsJson(String categoryId) { return JsonResponses.wrapData(repository.findWordsJson(categoryId)); }
    public String listUsersJson() { return JsonResponses.wrapData(repository.findUsersJson()); }
    public String listStudyRecordsJson() { return JsonResponses.wrapData(repository.findStudyRecordsJson()); }
    public String listFavoritesJson() { return JsonResponses.wrapData(repository.findFavoritesJson()); }
    public String listErrorsJson() { return JsonResponses.wrapData(repository.findErrorWordsJson()); }
    public String listSavedWordsJson() { return JsonResponses.wrapData(repository.findSavedWordsJson()); }
    public String listUserFavoritesJson(int userId) { return JsonResponses.wrapData(repository.findFavoritesJsonByUser(userId)); }
    public String listUserErrorsJson(int userId) { return JsonResponses.wrapData(repository.findErrorWordsJsonByUser(userId)); }
    public String listUserStudyRecordsJson(int userId) { return JsonResponses.wrapData(repository.findStudyRecordsJsonByUser(userId)); }
    public String listUserSavedWordsJson(int userId) { return JsonResponses.wrapData(repository.findSavedWordsJsonByUser(userId)); }
    public boolean clearUserFavorites(int userId) { return repository.clearFavoritesByUser(userId); }
    public boolean clearUserErrors(int userId) { return repository.clearErrorsByUser(userId); }
    public boolean clearUserStudyRecords(int userId) { return repository.clearStudyRecordsByUser(userId); }
    public boolean clearUserSavedWords(int userId) { return repository.clearSavedWordsByUser(userId); }
    public boolean removeUser(int userId) { return repository.deleteUser(userId); }
    public boolean addCategory(String name, int sort, boolean isSystem) { return repository.insertCategory(name, sort, isSystem); }
    public boolean editCategory(int id, String name, int sort, boolean isSystem) { return repository.updateCategory(id, name, sort, isSystem); }
    public boolean removeCategory(int id) { return repository.deleteCategory(id); }
    public boolean addDict(String name, String description, int ownerAdminId, boolean isCustom) { return repository.insertDict(name, description, ownerAdminId, isCustom); }
    public boolean editDict(int id, String name, String description) { return repository.updateDict(id, name, description); }
    public boolean removeDict(int id) { return repository.deleteDict(id); }
    public boolean addWord(Integer categoryId, Integer dictId, String word, String meaning, String phonetic, String example, int recommended) { return repository.insertWord(categoryId, dictId, word, meaning, phonetic, example, recommended); }
    public boolean editWord(int id, Integer categoryId, Integer dictId, String word, String meaning, String phonetic, String example, int recommended) { return repository.updateWord(id, categoryId, dictId, word, meaning, phonetic, example, recommended); }
    public boolean removeWord(int id) { return repository.deleteWord(id); }

    public boolean addFavorite(int userId, int wordId, String word, String trans) { return repository.addFavorite(userId, wordId, word, trans); }
    public boolean deleteFavorite(int id) { return repository.deleteFavorite(id); }
    public boolean addErrorWord(int userId, String word, String trans, String dictId) { return repository.addErrorWord(userId, word, trans, dictId); }
    public boolean deleteErrorWord(int id) { return repository.deleteErrorWord(id); }
    public boolean addStudyRecord(int userId, String categoryName, int totalWords, int accuracy) { return repository.addStudyRecord(userId, categoryName, totalWords, accuracy); }
    public boolean deleteStudyRecord(int id) { return repository.deleteStudyRecord(id); }
    public boolean addSavedWord(int userId, String word, String trans, String usphone, String ukphone, String example) { return repository.addSavedWord(userId, word, trans, usphone, ukphone, example); }
    public boolean deleteSavedWord(int id) { return repository.deleteSavedWord(id); }

    public void saveSnapshot(int userId, String snapshotJson) { SNAPSHOTS.put(userId, snapshotJson); }
    public String listSnapshotsJson() {
        List<String> snapshots = SNAPSHOTS.entrySet().stream()
                .map(entry -> "{\"userId\":" + entry.getKey() + ",\"snapshot\":" + escapeJson(entry.getValue()) + ",\"syncedAt\":" + System.currentTimeMillis() + "}")
                .collect(Collectors.toList());
        return JsonResponses.wrapData(snapshots);
    }
    public String listLatestSnapshotJson() {
        if (SNAPSHOTS.isEmpty()) return JsonResponses.wrapData(new ArrayList<String>());
        Integer latestUserId = SNAPSHOTS.keySet().stream().findFirst().orElse(0);
        String snapshot = SNAPSHOTS.get(latestUserId);
        List<String> result = new ArrayList<>();
        result.add("{\"userId\":" + latestUserId + ",\"snapshot\":" + escapeJson(snapshot) + ",\"syncedAt\":" + System.currentTimeMillis() + "}");
        return JsonResponses.wrapData(result);
    }
    public String listSnapshotByUserJson(int userId) {
        String snapshot = SNAPSHOTS.get(userId);
        if (snapshot == null) return JsonResponses.wrapData(new ArrayList<String>());
        List<String> result = new ArrayList<>();
        result.add("{\"userId\":" + userId + ",\"snapshot\":" + escapeJson(snapshot) + ",\"syncedAt\":" + System.currentTimeMillis() + "}");
        return JsonResponses.wrapData(result);
    }
    private String escapeJson(String text) { if (text == null) return "\"\""; return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"") + "\""; }
}
