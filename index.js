import http from "node:http";

const server = http.createServer((req, res) => {
  console.log(req.headers);
  console.log(req.method);

  console.log("new connection");
  res.end("hello");
});

server.listen(8080, "127.0.0.1");
