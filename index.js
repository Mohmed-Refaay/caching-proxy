import fetch from "node-fetch";
import http from "node:http";
import morgan from "morgan";

const TARGET_HOST = "https://dummyjson.com";

const logger = morgan("dev");

const cachedData = {};

const server = http.createServer(async (req, res) => {
  logger(req, res, async (err) => {
    const path = req.url;
    const method = req.method;

    let data;
    let contentType;
    let statusCode;
    if (method === "GET" && path in cachedData) {
      console.log("From Cache!");
      data = cachedData[path].data;
      contentType = cachedData[path].contentType;
      statusCode = cachedData[path].statusCode;
    } else {
      const result = await fetch(`${TARGET_HOST}${path}`, {
        method,
      });

      data = await result.arrayBuffer();
      data = Buffer.from(data);
      contentType =
        result.headers.get("Content-Type") ?? "application/json";
      statusCode = result.status;
      if (result.ok) {
        cachedData[path] = {
          data,
          contentType,
          statusCode,
        };

        setTimeout(() => {
          delete cachedData[path];
        }, 5000);
      }
    }

    res.setHeader("Content-Type", contentType);
    res.statusCode = statusCode;
    res.end(data);
  });
});

server.listen(8080, "127.0.0.1");
