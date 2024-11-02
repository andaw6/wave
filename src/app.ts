import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import authRoute from "./routes/authRoute";
import userRoute from "./routes/userRoute";
import transactionRoute from "./routes/transactionRoute";


const app = express();


app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/transactions", transactionRoute);

app.get("/", (req: Request, res: Response) => {
    res.send("Bienvenue dans notre api wave");
})

export default app;