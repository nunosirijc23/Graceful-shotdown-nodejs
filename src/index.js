import { createServer } from "node:http";
import { once } from "node:events";

async function handler(request, response) {
    try {
        const data = JSON.parse(await once(request, "data"));
        console.error("\nreceived", data);

        response.writeHead(200);
        response.end(JSON.stringify(data));

        setTimeout(() => {
            throw new Error("it will be handled on uncaughtException");
        }, 1000);

        Promise.reject("it will be handled on unhandledRejection");
    } catch (error) {
        console.error("DEU RUIM", error.stack);
        response.writeHead(500);
        response.end();
    }
}

const server = createServer(handler)
    .listen(3000)
    .on("listening", () => console.log("server running at 3000"));

// captura erros nao tratados
// se nao tiver ele o sistema para de rodar
process.on("uncaughtException", (error, origin) => {
    console.log(`\n${origin} signal received. \n${error}`);
});

// captura promise nao tratadas
// se nao tiver ele o sistema da warining
process.on("unhandledRejection", (error) => {
    console.log(`\nsignal received. \n${error}`);
});

// --- gracefulshotdown
function grafulShutdown(event) {
    return (code) => {
        console.log(`${event} reveived with ${code}`);

        // garantimos que nenhum cliente vai entrar nessa aplicacao no periodo
        // mas quem esta em alguma transacao, termina o que esta fazendo
        server.close(() => {
            console.log("http server closed");
            console.log("DB connection closed");
            process.exit(code);
        })
        
    }
}

// disparado no Ctrl + C no terminal -> multi plataforma
process.on("SIGINT", grafulShutdown("SIGINT"));

// disparado quando aplicam um kill no processo
process.on("SIGTERM", grafulShutdown("SIGTERM"));

// disparado sempre que o sistema for encerrado
process.on("exit", (code) => {
    console.log("exit signal received", code);
})