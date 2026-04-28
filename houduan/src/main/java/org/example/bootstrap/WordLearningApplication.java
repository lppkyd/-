package org.example.bootstrap;

import com.sun.net.httpserver.HttpServer;
import org.example.controller.*;
import org.example.repository.WordRepository;
import org.example.service.WordService;
import org.example.support.MysqlConnectionFactory;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class WordLearningApplication {
    private static final int PORT = 8080;
    public void start() throws IOException {
        MysqlConnectionFactory connectionFactory = new MysqlConnectionFactory();
        WordRepository repository = new WordRepository(connectionFactory);
        WordService service = new WordService(repository);
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/health", new HealthController());
        server.createContext("/api/auth/login", new AuthController(connectionFactory));
        server.createContext("/api/categories", new CategoryController(service));
        server.createContext("/api/words", new WordController(service));
        server.createContext("/api/users", new UserController(service));
        server.createContext("/api/dicts", new DictController(service));
        server.createContext("/api/study-records", new StudyRecordController(service));
        server.createContext("/api/favorites", new FavoriteController(service));
        server.createContext("/api/errors", new ErrorController(service));
        server.createContext("/api/saved-words", new SavedWordController(service));
        server.createContext("/api/sync/snapshot", new SnapshotController(service));
        server.setExecutor(Executors.newCachedThreadPool()); server.start();
        System.out.println("Word learning backend started at http://localhost:" + PORT);
    }
}
