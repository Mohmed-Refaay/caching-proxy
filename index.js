import fetch from "node-fetch";
import http from "node:http";
import morgan from "morgan";
import { Mutex } from "async-mutex";

const TARGET_HOST = "https://dummyjson.com";
const TTL = 5000;

const logger = morgan("dev");

const cachedData = {};

const processingRequests = new Map();

const server = http.createServer(async (req, res) => {
  logger(req, res, async (err) => {
    const path = req.url;
    const method = req.method;

    let data;
    let contentType;
    let statusCode;
    let cacheHeader = "MISS";

    if (processingRequests.has(path)) {
      await processingRequests.get(path).waitForUnlock();
    }

    if (method === "GET" && path in cachedData) {
      const cache = cachedData[path];
      data = cache.data;
      contentType = cache.contentType;
      statusCode = cache.statusCode;
      cacheHeader = "HIT";

      // keep the data for more TTL time;
      clearTimeout(cache.timeoutId);
      const timeoutId = setTimeout(() => {
        delete cachedData[path];
      }, TTL);
      cache.timeoutId = timeoutId;
    } else {
      let release;
      if (method === "GET") {
        const mutex = new Mutex();
        processingRequests.set(path, mutex);
        release = await mutex.acquire();
      }
      const result = await fetch(`${TARGET_HOST}${path}`, {
        method,
      });

      data = await result.arrayBuffer();
      data = Buffer.from(data);
      contentType =
        result.headers.get("Content-Type") ?? "application/json";
      statusCode = result.status;
      if (result.ok && method === "GET") {
        const timeoutId = setTimeout(() => {
          delete cachedData[path];
        }, TTL);

        cachedData[path] = {
          data,
          contentType,
          statusCode,
          timeoutId,
        };
        processingRequests.delete(path);
        release();
      }
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Cache", cacheHeader);
    res.statusCode = statusCode;
    res.end(data);
  });
});

server.listen(8080, "127.0.0.1");
